#!/bin/bash

# Script de despliegue rápido para Multipage Document Analysis
# Autor: AWS Samples
# Fecha: $(date)

set -e

echo "🚀 Iniciando despliegue de Multipage Document Analysis..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes con color
print_message() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar prerrequisitos
check_prerequisites() {
    print_message "Verificando prerrequisitos..."
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js no está instalado. Por favor instala Node.js >= 14.0.0"
        exit 1
    fi
    
    # Verificar Python
    if ! command -v python3 &> /dev/null; then
        print_error "Python3 no está instalado. Por favor instala Python >= 3.10"
        exit 1
    fi
    
    # Verificar Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker no está instalado. Por favor instala Docker"
        exit 1
    fi
    
    # Verificar AWS CLI
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI no está instalado. Por favor instala AWS CLI"
        exit 1
    fi
    
    # Verificar CDK
    if ! command -v cdk &> /dev/null; then
        print_warning "CDK no está instalado. Instalando..."
        npm install -g aws-cdk
    fi
    
    print_success "Todos los prerrequisitos están instalados"
}

# Configurar parámetros
setup_parameters() {
    print_message "Configurando parámetros de despliegue..."
    
    # Parámetros por defecto
    LANGUAGE_CODE=${LANGUAGE_CODE:-"es"}
    INCLUDE_EXAMPLES=${INCLUDE_EXAMPLES:-"false"}
    PAGES_CHUNK=${PAGES_CHUNK:-"5"}
    EXTRACTION_CONFIDENCE=${EXTRACTION_CONFIDENCE:-"85"}
    
    echo "Parámetros de despliegue:"
    echo "  - Idioma: $LANGUAGE_CODE"
    echo "  - Incluir ejemplos: $INCLUDE_EXAMPLES"
    echo "  - Páginas por chunk: $PAGES_CHUNK"
    echo "  - Nivel de confianza: $EXTRACTION_CONFIDENCE"
}

# Verificar credenciales AWS
check_aws_credentials() {
    print_message "Verificando credenciales de AWS..."
    
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "Las credenciales de AWS no están configuradas correctamente"
        print_message "Por favor ejecuta: aws configure"
        exit 1
    fi
    
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    REGION=$(aws configure get region)
    
    print_success "Credenciales verificadas - Cuenta: $ACCOUNT_ID, Región: $REGION"
}

# Verificar acceso a modelos de Bedrock
check_bedrock_access() {
    print_message "Verificando acceso a modelos de Bedrock..."
    
    # Verificar que los modelos Claude estén disponibles
    if aws bedrock list-foundation-models --region us-east-1 --query 'modelSummaries[?contains(modelId, `claude-3-haiku`)]' --output text | grep -q claude; then
        print_success "Acceso a Claude 3 Haiku verificado"
    else
        print_warning "No se pudo verificar acceso a Claude 3 Haiku"
    fi
    
    if aws bedrock list-foundation-models --region us-east-1 --query 'modelSummaries[?contains(modelId, `claude-3-5-sonnet`)]' --output text | grep -q claude; then
        print_success "Acceso a Claude 3.5 Sonnet verificado"
    else
        print_warning "No se pudo verificar acceso a Claude 3.5 Sonnet"
    fi
}

# Desplegar backend
deploy_backend() {
    print_message "Desplegando backend..."
    
    cd backend
    
    # Crear entorno virtual si no existe
    if [ ! -d ".venv" ]; then
        print_message "Creando entorno virtual de Python..."
        python3 -m venv .venv
    fi
    
    # Activar entorno virtual
    source .venv/bin/activate
    
    # Instalar dependencias
    print_message "Instalando dependencias de Python..."
    pip install -r requirements.txt
    
    # Login en ECR público
    print_message "Haciendo login en ECR público..."
    aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws
    
    # Bootstrap CDK si es necesario
    print_message "Verificando bootstrap de CDK..."
    if ! aws cloudformation describe-stacks --stack-name CDKToolkit &> /dev/null; then
        print_message "Haciendo bootstrap de CDK..."
        cdk bootstrap
    else
        print_success "CDK ya está bootstrapped"
    fi
    
    # Desplegar stack
    print_message "Desplegando stack de CDK..."
    cdk deploy \
        --parameters LanguageCode=$LANGUAGE_CODE \
        --parameters IncludeExamples=$INCLUDE_EXAMPLES \
        --parameters PagesChunk=$PAGES_CHUNK \
        --parameters ExtractionConfidenceLevel=$EXTRACTION_CONFIDENCE \
        --require-approval never
    
    # Obtener outputs
    print_message "Obteniendo outputs del stack..."
    cdk output > ../stack-outputs.json
    
    cd ..
    
    print_success "Backend desplegado exitosamente"
}

# Función principal
main() {
    echo "======================================"
    echo "  Multipage Document Analysis Deploy  "
    echo "======================================"
    echo ""
    
    check_prerequisites
    setup_parameters
    check_aws_credentials
    check_bedrock_access
    deploy_backend
    
    print_success "¡Despliegue completado exitosamente!"
    echo ""
    echo "📋 Próximos pasos:"
    echo "1. Revisa los outputs en stack-outputs.json"
    echo "2. Configura el frontend (ver frontend/README.md)"
    echo "3. Crea usuarios en Cognito para acceder a la aplicación"
    echo ""
    echo "📚 Documentación: README.md"
    echo "💰 Costos estimados: ~$1,273 USD/mes para 1,000 documentos"
    echo ""
}

# Ejecutar función principal
main "$@"
