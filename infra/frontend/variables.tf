variable "aws_region" {
  description = "Región del bucket S3 (CloudFront y ACM son globales / us-east-1)."
  type        = string
  default     = "us-east-1"
}

variable "root_domain" {
  description = "Dominio raíz con zona alojada pública en Route 53 (SUPUESTO: está en esta misma cuenta)."
  type        = string
  default     = "jukidev.com"
}

variable "subdomain" {
  description = "Subdominio del frontend; el sitio queda en <subdomain>.<root_domain>."
  type        = string
  default     = "cuncho"
}

variable "api_origin" {
  description = "Origen de la API, sin ruta. Se permite en connect-src de la CSP."
  type        = string
  default     = "https://cuncho-api.jukidev.com"
}

variable "extra_connect_src" {
  description = "Orígenes adicionales permitidos en connect-src de la CSP (p. ej. el dominio de Cognito para el canje del código de Google)."
  type        = list(string)
  default     = []
}

variable "bucket_name" {
  description = "Nombre del bucket. Si es null se usa cuncho-frontend-<id de cuenta> (los nombres son únicos globalmente)."
  type        = string
  default     = null
}

variable "github_owner" {
  description = "Usuario u organización de GitHub dueña del repo (sin valor por defecto a propósito)."
  type        = string
}

variable "github_repo" {
  description = "Nombre del repositorio de GitHub (sin valor por defecto a propósito)."
  type        = string
}

variable "github_owner_id" {
  description = "ID numérico del dueño en GitHub. GitHub ya emite el sub como repo:<owner>@<id>/<repo>@<id>:...; vacío = solo el formato antiguo."
  type        = string
  default     = ""
}

variable "github_repo_id" {
  description = "ID numérico del repositorio en GitHub (ver github_owner_id)."
  type        = string
  default     = ""
}

variable "github_environment" {
  description = "Environment de GitHub Actions al que se limita la confianza del rol OIDC."
  type        = string
  default     = "production"
}

variable "create_github_oidc_provider" {
  description = "Crear el proveedor OIDC de GitHub. Una cuenta solo puede tener uno: pon false si ya existe."
  type        = bool
  default     = true
}
