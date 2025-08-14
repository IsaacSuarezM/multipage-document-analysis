# 🚀 Guía de Inicio Rápido

## Despliegue en 5 minutos

### 1. Prerrequisitos
```bash
# Verificar que tienes todo instalado
node --version    # >= 14.0.0
python3 --version # >= 3.10
docker --version
aws --version
```

### 2. Configurar AWS
```bash
# Configurar credenciales
aws configure

# Verificar acceso
aws sts get-caller-identity
```

### 3. Clonar y desplegar
```bash
# Clonar repositorio
git clone <tu-repo-url>
cd multipage-document-analysis

# Despliegue automático
./deploy.sh
```

### 4. Verificar despliegue
```bash
# Ver outputs del stack
cat stack-outputs.json

# Verificar en AWS Console
aws cloudformation describe-stacks --stack-name Stack-MultipageDocumentAnalysis
```

## ⚡ Despliegue Manual (Paso a paso)

### Backend
```bash
cd backend

# Entorno virtual
python3 -m venv .venv
source .venv/bin/activate

# Dependencias
pip install -r requirements.txt

# ECR Login
aws ecr-public get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin public.ecr.aws

# CDK Bootstrap
cdk bootstrap

# Desplegar
cdk deploy \
  --parameters LanguageCode=es \
  --parameters IncludeExamples=false \
  --parameters PagesChunk=5 \
  --parameters ExtractionConfidenceLevel=85 \
  --require-approval never
```

### Frontend
```bash
cd frontend
# Ver frontend/README.md para instrucciones específicas
```

## 🔧 Variables de Entorno

Puedes personalizar el despliegue con estas variables:

```bash
export LANGUAGE_CODE=es                    # es|en
export INCLUDE_EXAMPLES=false              # true|false
export PAGES_CHUNK=5                       # número de páginas
export EXTRACTION_CONFIDENCE=85            # 0-99
```

## 📊 Verificar Funcionamiento

### 1. Crear usuario en Cognito
```bash
# Obtener User Pool ID del output
USER_POOL_ID=$(aws cloudformation describe-stacks \
  --stack-name Stack-MultipageDocumentAnalysis \
  --query 'Stacks[0].Outputs[?OutputKey==`CognitoUserPoolId`].OutputValue' \
  --output text)

# Crear usuario
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username testuser \
  --user-attributes Name=email,Value=test@example.com \
  --temporary-password TempPass123! \
  --message-action SUPPRESS
```

### 2. Probar API
```bash
# Obtener API endpoint
API_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name Stack-MultipageDocumentAnalysis \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayRestApiEndpoint`].OutputValue' \
  --output text)

# Probar endpoint de salud
curl $API_ENDPOINT/multipage-doc-analysis/jobs/query
```

## 🆘 Solución de Problemas

### Error de espacio en disco
```bash
# Limpiar Docker
docker system prune -a -f

# Limpiar archivos temporales
rm -rf /tmp/*
```

### Error de permisos Bedrock
```bash
# Verificar modelos disponibles
aws bedrock list-foundation-models --region us-east-1 \
  --query 'modelSummaries[?contains(modelId, `claude`)]'
```

### Error de bootstrap CDK
```bash
# Re-bootstrap
cdk bootstrap --force
```

## 🧹 Limpieza

Para eliminar todos los recursos:

```bash
cd backend
cdk destroy
```

## 📞 Ayuda

- 📖 [README completo](README_REPO.md)
- 🏗️ [Documentación del Backend](backend/README.md)
- 🎨 [Documentación del Frontend](frontend/README.md)
- 🐛 [Reportar problemas](../../issues)

---

**⏱️ Tiempo estimado de despliegue: 10-15 minutos**
**💰 Costo estimado: $1,273/mes para 1,000 documentos**
