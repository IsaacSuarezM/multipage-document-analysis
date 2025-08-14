# Multipage Document Analysis with Generative AI

Este repositorio contiene una solución completa para el análisis automatizado de documentos PDF de múltiples páginas utilizando Inteligencia Artificial Generativa (GenAI) y Amazon Bedrock.

## 🎯 Descripción

Esta solución permite extraer información definida por el usuario de documentos PDF arbitrariamente largos, superando las limitaciones de ventana de contexto de los LLMs mediante una técnica similar a map-reduce. La solución utiliza los modelos Claude 3 de Anthropic disponibles en Amazon Bedrock.

## 🏗️ Arquitectura

La solución implementa un enfoque map-reduce para procesar documentos largos:

1. **Map**: Extrae información de chunks del documento menores a la ventana de contexto del LLM
2. **Reduce**: Consolida las múltiples instancias de información extraída en un único resultado

![Arquitectura](readme_assets/architecture.png)

## 🚀 Servicios AWS Utilizados

- **Amazon Textract**: Extracción de texto de PDFs
- **Amazon Bedrock**: Modelos Claude 3 Haiku y Claude 3.5 Sonnet
- **AWS Lambda**: Funciones de procesamiento
- **Amazon DynamoDB**: Almacenamiento de resultados
- **Amazon S3**: Almacenamiento de documentos
- **Amazon API Gateway**: API REST
- **Amazon Cognito**: Autenticación de usuarios
- **AWS Step Functions**: Orquestación del workflow
- **Amazon SNS/SQS**: Notificaciones y colas
- **Amazon EventBridge**: Triggers de eventos

## 📋 Prerrequisitos

### Software requerido:
- **Node.js** >= 14.0.0
- **Python** >= 3.10
- **Docker**
- **AWS CLI** configurado
- **AWS CDK** >= v2.174.1

### Permisos AWS:
- Acceso a los modelos **Claude 3 Haiku** y **Claude 3.5 Sonnet V1** en Amazon Bedrock
- Permisos para crear recursos de infraestructura (IAM, Lambda, DynamoDB, etc.)

## 🛠️ Instalación y Despliegue

### 1. Clonar el repositorio
```bash
git clone <tu-repositorio-url>
cd multipage-document-analysis
```

### 2. Desplegar el Backend

```bash
cd backend

# Crear entorno virtual
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate.bat

# Instalar dependencias
pip install -r requirements.txt

# Login en ECR público
aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws

# Bootstrap CDK (si es necesario)
cdk bootstrap

# Desplegar
cdk deploy \
--parameters LanguageCode=es \
--parameters IncludeExamples=false \
--parameters PagesChunk=5 \
--parameters ExtractionConfidenceLevel=85 \
--require-approval never
```

### 3. Desplegar el Frontend

```bash
cd ../frontend
# Seguir las instrucciones en frontend/README.md
```

## ⚙️ Parámetros de Configuración

| Parámetro | Descripción | Valores | Por defecto |
|-----------|-------------|---------|-------------|
| `LanguageCode` | Idioma del documento y resultados | `es`, `en` | `es` |
| `IncludeExamples` | Usar few-shot learning | `true`, `false` | `false` |
| `PagesChunk` | Páginas por chunk | Número entero | `5` |
| `ExtractionConfidenceLevel` | Umbral de confianza (0-99) | 0-99 | `85` |

## 💰 Costos Estimados

**Aproximadamente $1,273 USD/mes** para procesar 1,000 documentos de 100 páginas cada uno.

### Desglose de costos (región us-east-1):
- Amazon Textract: ~$150
- Amazon Bedrock (Claude 3 Haiku): ~$938
- Amazon Bedrock (Claude 3.5 Sonnet): ~$150
- Otros servicios AWS: ~$35

## 📊 Outputs del Stack

Después del despliegue, obtendrás:

- **ApiGatewayRestApiEndpoint**: URL de la API REST
- **CognitoUserPoolId**: ID del User Pool de Cognito
- **CognitoUserPoolClientId**: ID del cliente de aplicación
- **CognitoIdentityPoolId**: ID del Identity Pool
- **RegionName**: Región de despliegue

## 🔧 Personalización

### Definir información a extraer

1. Navega a `backend/pace_backend/text_analysis_workflow/shared/`
2. Crea `InformationExtraction.py` siguiendo el ejemplo de `CharterReports.py`
3. Define objetos Pydantic para la información a extraer
4. Actualiza `section_definition.py` con tus nuevas secciones

### Agregar ejemplos (Few-shot learning)

1. Crea ejemplos en `backend/pace_backend/text_analysis_workflow/extract_data_to_schema_fn/prompt_selector/examples/{language_code}/`
2. Para cada sección, agrega pares de archivos:
   - `example_chunk_{i}.txt`: Texto de ejemplo
   - `example_chunk_{i}.json`: Información extraída correspondiente

## 🔒 Seguridad

- Autenticación mediante Amazon Cognito
- Protección API con AWS WAF
- Cifrado en tránsito y en reposo
- Principio de menor privilegio en roles IAM

## 📚 Documentación Adicional

- [README del Backend](backend/README.md)
- [README del Frontend](frontend/README.md)
- [Guías de Seguridad](readme_assets/security.md)

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## ⚠️ Disclaimer Legal

El código de ejemplo, bibliotecas de software, herramientas de línea de comandos, pruebas de concepto, plantillas u otra tecnología relacionada se proporciona como "Contenido de AWS" bajo el Acuerdo de Cliente de AWS. No debes usar este Contenido de AWS en tus cuentas de producción, o en datos de producción u otros datos críticos.

## 📞 Soporte

Para preguntas o problemas:

1. Revisa la documentación
2. Busca en los issues existentes
3. Crea un nuevo issue con detalles del problema

---

**Nota**: Este proyecto requiere acceso a los modelos de Amazon Bedrock y puede incurrir en costos de AWS. Revisa los costos estimados antes del despliegue.
