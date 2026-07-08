# CI/CD 파이프라인

이 레포에는 두 개의 GitHub Actions 워크플로가 있다.

| 워크플로 | 파일 | 트리거 | 하는 일 |
| --- | --- | --- | --- |
| **CI 게이트** | `.github/workflows/ci.yml` | PR, `main` push | `lint` + `typecheck` + `build` |
| **ECS 배포** | `.github/workflows/deploy.yml` | `main` push, 수동 | Docker build → ECR push → ECS 갱신 |

CI는 추가 설정 없이 바로 동작한다. 배포 워크플로는 아래 AWS/GitHub 설정을 마쳐야 실제로 돈다.

---

## 1단계: CI 게이트 (설정 불필요) + branch protection

`ci.yml`은 push하면 즉시 동작한다. 여기에 **branch protection**을 걸면 "통과해야만 머지" 규칙이 완성된다.

**GitHub → Settings → Branches → Add branch ruleset (또는 Branch protection rule)**
- Target: `main`
- ✅ Require a pull request before merging
- ✅ Require status checks to pass → 검색해서 **`Lint · Typecheck · Build`** 추가
- (선택) ✅ Require branches to be up to date before merging

이제 CI 실패 시 main 머지가 차단된다.

---

## 2단계: OIDC → ECR → ECS 배포

### 2-1. ECR 리포지토리 생성

```bash
aws ecr create-repository --repository-name resume-builder --region ap-northeast-2
```

### 2-2. ECS 리소스 준비 (Fargate 권장)

- **클러스터**, **서비스**, **task definition**(컨테이너 1개, 포트 `3000`)
- 컨테이너 이름을 정해두기 (워크플로의 `CONTAINER_NAME`과 일치해야 함)
- **런타임 시크릿**: `ANTHROPIC_API_KEY`는 이미지에 굽지 말고, task definition의
  `secrets`로 **Secrets Manager / SSM Parameter Store**에서 주입한다.

  ```jsonc
  // task definition containerDefinitions[].secrets 예시
  "secrets": [
    { "name": "ANTHROPIC_API_KEY",
      "valueFrom": "arn:aws:ssm:ap-northeast-2:<ACCOUNT_ID>:parameter/resume-builder/ANTHROPIC_API_KEY" }
  ]
  ```
  (task **execution role**에 해당 파라미터 읽기 권한 필요)

### 2-3. GitHub OIDC provider 등록 (계정당 1회)

AWS IAM → Identity providers → Add provider:
- Provider type: **OpenID Connect**
- Provider URL: `https://token.actions.githubusercontent.com`
- Audience: `sts.amazonaws.com`

### 2-4. 배포용 IAM Role 생성 (장기 키 불필요)

**신뢰 정책(trust policy)** — 이 레포에서만 assume 가능하도록 제한:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
    },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": { "token.actions.githubusercontent.com:aud": "sts.amazonaws.com" },
      "StringLike": { "token.actions.githubusercontent.com:sub": "repo:DevJunyg/resume-builder:*" }
    }
  }]
}
```
> 배포를 main 브랜치로만 제한하려면 `sub`를
> `repo:DevJunyg/resume-builder:ref:refs/heads/main` 으로 좁힌다.

**권한 정책(permissions)** — ECR push + ECS 배포 + PassRole:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Sid": "ECRAuth", "Effect": "Allow", "Action": "ecr:GetAuthorizationToken", "Resource": "*" },
    { "Sid": "ECRPush", "Effect": "Allow",
      "Action": ["ecr:BatchCheckLayerAvailability","ecr:InitiateLayerUpload","ecr:UploadLayerPart",
                 "ecr:CompleteLayerUpload","ecr:PutImage","ecr:BatchGetImage","ecr:GetDownloadUrlForLayer"],
      "Resource": "arn:aws:ecr:<REGION>:<ACCOUNT_ID>:repository/resume-builder" },
    { "Sid": "ECSDeploy", "Effect": "Allow",
      "Action": ["ecs:DescribeTaskDefinition","ecs:RegisterTaskDefinition",
                 "ecs:DescribeServices","ecs:UpdateService"],
      "Resource": "*" },
    { "Sid": "PassRole", "Effect": "Allow", "Action": "iam:PassRole",
      "Resource": ["arn:aws:iam::<ACCOUNT_ID>:role/ecsTaskExecutionRole",
                   "arn:aws:iam::<ACCOUNT_ID>:role/resume-builder-task-role"],
      "Condition": { "StringEquals": { "iam:PassedToService": "ecs-tasks.amazonaws.com" } } }
  ]
}
```

### 2-5. GitHub 저장소 Variables 설정

**Settings → Secrets and variables → Actions → Variables** 탭에 아래를 등록
(민감정보 아님 — Role ARN/리소스 이름이라 Variables로 충분):

| 이름 | 예시 |
| --- | --- |
| `AWS_REGION` | `ap-northeast-2` |
| `AWS_ROLE_ARN` | `arn:aws:iam::<ACCOUNT_ID>:role/gha-resume-builder-deploy` |
| `ECR_REPOSITORY` | `resume-builder` |
| `ECS_CLUSTER` | `resume-builder-cluster` |
| `ECS_SERVICE` | `resume-builder-service` |
| `ECS_TASK_FAMILY` | `resume-builder-task` |
| `CONTAINER_NAME` | `resume-builder` |

> `ANTHROPIC_API_KEY`는 **GitHub에 넣지 않는다.** 런타임 시크릿은 ECS task
> definition에서 Secrets Manager/SSM으로 주입한다(2-2 참고).

### 2-6. 테스트

- main에 머지하면 자동 배포. 또는 **Actions → Deploy to Amazon ECS → Run workflow**로 수동 실행.
- 로그에서 `Deploy to Amazon ECS` 스텝이 서비스 안정화까지 대기하는지 확인.

---

## 이미지(Dockerfile) 메모

- `next.config.ts`의 `output: "standalone"` + 멀티스테이지 빌드로 **dev 의존성 없는 최소 런타임 이미지**를 만든다.
- 비루트 사용자(`nextjs`)로 실행, 포트 `3000`.
- 로컬 확인:
  ```bash
  docker build -t resume-builder .
  docker run --rm -p 3000:3000 -e ANTHROPIC_API_KEY=sk-... resume-builder
  ```

## 다음 단계 (3~6단계)

- **CodeDeploy Blue/Green** + CloudWatch 알람 기반 자동 롤백
- **Terraform**으로 ECR/ECS/ALB/IAM 코드화, PR에 `terraform plan` 코멘트
- **Trivy** 이미지 스캔 / **cosign** 서명 / **Dependabot** / **CodeQL**
- 배포 성공·실패 **Slack 알림**
