# EKS overlay (does not change `Dockerfile.aws` or `nginx.aws.conf`)

Use this folder when deploying the full app to **EKS** with:

- **Namespace** `yelp`
- **Kafka workers** (same as `k8s/workers/`, with ECR images)
- **Frontend** image built with **`Dockerfile.aws-eks`**, which matches **`Dockerfile`** (local `k8s`): **`nginx.conf`** + **`VITE_API_URL` empty** so the app behaves like local Kubernetes.

**Uploads:** `k8s/` uses a shared **ReadWriteMany** `uploads-pvc` (fine on Minikube/kind). `k8s-aws/services/` still use **emptyDir** for `/app/uploads` because a single **gp2** volume is **ReadWriteOnce** and cannot attach to all four API pods at once. To mirror shared uploads on EKS you would add **EFS** (not included here).

Your existing **`k8s-aws/`** layout is unchanged except MongoDB now uses **`mongo-pvc`** like `k8s/`, and Kafka **`KAFKA_LISTENERS`** matches `k8s/kafka/kafka.yaml`.

## 1) Build and push the EKS frontend image

From `Yelp/frontend` (set `ECR_REGISTRY` to your account + region):

```bash
docker buildx build --platform linux/amd64 \
  -f Dockerfile.aws-eks \
  -t "${ECR_REGISTRY}/yelp-frontend:lab-latest" \
  --push .
```

Push worker images to the same `:lab-latest` tag (see main project README / prior ECR commands).

## 2) Namespace first, then shared base from `k8s-aws/` (no `k8s-aws/frontend` yet)

```bash
kubectl apply -f k8s-aws-eks/base/namespace.yaml
kubectl apply -f k8s-aws/base/configmap.yaml
kubectl apply -f k8s-aws/base/secret.yaml
kubectl apply -f k8s-aws/mongodb/
kubectl apply -f k8s-aws/kafka/
kubectl apply -f k8s-aws/services/
```

## 3) Apply EKS-only workers + frontend

```bash
kubectl apply -f k8s-aws-eks/workers/
kubectl apply -f k8s-aws-eks/frontend/deployment.yaml
```

If you already applied **`k8s-aws/frontend/deployment.yaml`** before, this file updates the same `Deployment` / `Service` names with the EKS image and is safe to re-apply.

## 4) Verify

```bash
kubectl get pods -n yelp
kubectl get svc -n yelp frontend-service
```
