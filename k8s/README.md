# CloudMart K8s Deployment

## الـ Structure

```
k8s/
├── base/
│   └── namespace.yaml
├── secrets/
│   └── secrets.yaml
├── databases/
│   ├── identity-db.yaml
│   ├── inventory-db.yaml
│   ├── order-db.yaml
│   ├── catalog-db.yaml
│   ├── cart-redis.yaml
│   └── rabbitmq.yaml
├── services/
│   ├── identity-service.yaml
│   ├── product-catalog-service.yaml
│   ├── inventory-service.yaml
│   ├── cart-service.yaml
│   ├── order-service.yaml
│   ├── payment-service.yaml
│   └── api-gateway.yaml
├── frontend/
│   ├── frontend.yaml
│   └── ingress.yaml
└── monitoring/
    ├── prometheus.yaml
    └── grafana.yaml
```

## قبل التشغيل

### 1. غيّري أسماء الـ images في كل ملف بمجلد services/ و frontend/
لازم تكوني رفعتي الـ images على DockerHub باسمك:
```bash
image: tahany/identity-service:latest
```
غيّريها لو اسم اليوزر مختلف، أو استخدمي sed:
```bash
cd k8s
grep -rl "image: tahany/" . | xargs sed -i 's/tahany\//YOUR_DOCKERHUB_USERNAME\//g'
```

### 2. فعّلي Ingress Controller في Docker Desktop
Docker Desktop K8s مفيهوش Ingress Controller جاهز، لازم تثبتيه:
```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml
```

تأكدي إنه شغال:
```bash
kubectl get pods -n ingress-nginx
```

### 3. ثبّتي Metrics Server (مطلوب لـ Auto-scaling / HPA)
```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

على Docker Desktop غالباً هيحتاج تعديل واحد عشان الـ self-signed certs:
```bash
kubectl patch deployment metrics-server -n kube-system --type='json' \
  -p='[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"}]'
```

تأكدي إنه شغال (بياخد دقيقة لحد ما يظهر بيانات):
```bash
kubectl get pods -n kube-system | grep metrics-server
kubectl top nodes
kubectl top pods -n cloudmart
```

## ترتيب التشغيل (مهم!)

```bash
cd k8s

# 1. الـ Namespace الأول
kubectl apply -f base/namespace.yaml

# 2. الـ Secrets
kubectl apply -f secrets/secrets.yaml

# 3. الـ Databases (محتاجة وقت عشان تبقى Ready)
kubectl apply -f databases/

# انتظري الـ DBs تبقى Ready
kubectl get pods -n cloudmart -w
# (Ctrl+C لما تشوفي كله Running)

# 4. الـ Microservices
kubectl apply -f services/

# 4b. الـ Auto-scaling (HPA) - بعد ما الـ services تبقى Running
kubectl apply -f services/hpa.yaml

# 5. الـ Frontend والـ Ingress
kubectl apply -f frontend/

# 6. الـ Monitoring
kubectl apply -f monitoring/
```

## متابعة الـ Auto-scaling

```bash
# شوفي حالة كل الـ HPAs
kubectl get hpa -n cloudmart

# تفاصيل أكتر (current CPU% / target%)
kubectl describe hpa order-service-hpa -n cloudmart

# لو عايزة تجربي الـ scaling فعلياً، ولّدي load:
kubectl run -n cloudmart load-test --image=busybox --restart=Never -- \
  /bin/sh -c "while true; do wget -q -O- http://order-service:3000/health; done"
```

## أو شغليهم كلهم مرة واحدة (أسهل)

```bash
kubectl apply -f base/
kubectl apply -f secrets/
kubectl apply -f databases/
sleep 30   # استني الـ DBs
kubectl apply -f services/
kubectl apply -f frontend/
kubectl apply -f monitoring/
```

## متابعة الحالة

```bash
# شوفي كل الـ pods
kubectl get pods -n cloudmart

# شوفي الـ services
kubectl get svc -n cloudmart

# لو pod فيه مشكلة
kubectl describe pod <pod-name> -n cloudmart
kubectl logs <pod-name> -n cloudmart
```

## الوصول للتطبيق

```
Frontend + API (via Ingress): http://localhost
Prometheus:                   kubectl port-forward -n cloudmart svc/prometheus 9090:9090
Grafana:                      http://localhost:30080  (admin/admin)
```

## حذف كل حاجة (لو عايزة تبدئي من الأول)

```bash
kubectl delete namespace cloudmart
```
