variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "domain_prefix" {
  description = "Prefijo del dominio de Cognito (<prefijo>.auth.<región>.amazoncognito.com). Único por región; no puede contener 'aws', 'amazon' ni 'cognito'. null = cuncho-<id de cuenta>."
  type        = string
  default     = null
}

variable "google_client_id" {
  description = "ID de cliente OAuth 2.0 de Google (consola de Google Cloud → APIs y servicios → Credenciales)."
  type        = string
}

variable "google_client_secret" {
  description = "Secreto del cliente OAuth de Google."
  type        = string
  sensitive   = true
}

variable "callback_urls" {
  description = "URLs de retorno permitidas tras el login (el frontend las usa en /auth/callback)."
  type        = list(string)
  default     = ["https://cuncho.jukidev.com/auth/callback", "http://localhost:5173/auth/callback"]
}

variable "logout_urls" {
  type    = list(string)
  default = ["https://cuncho.jukidev.com/acceso", "http://localhost:5173/acceso"]
}
