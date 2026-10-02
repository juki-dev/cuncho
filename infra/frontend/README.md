# Infra del frontend (Terraform)

Crea: bucket S3 privado, CloudFront con OAC, certificado ACM (us-east-1) validado por DNS, registros A/AAAA
de `cuncho.jukidev.com` y el rol IAM de OIDC para GitHub Actions. No hay secretos en el código.

Supuesto: la zona `jukidev.com` de Route 53 está en la **misma cuenta** que se usa aquí.

## Pasos

1. Credenciales de AWS en tu shell (perfil o SSO) de la cuenta destino.
2. `cp terraform.tfvars.example terraform.tfvars` y rellena `github_owner` y `github_repo`.
   Si la cuenta ya tiene el proveedor OIDC de GitHub, añade `create_github_oidc_provider = false`.
3. `terraform init` (el estado empieza local; para S3 descomenta el bloque `backend` de `providers.tf`).
4. `terraform plan`, revisa y `terraform apply`. La primera vez tarda unos minutos (validación del certificado y CloudFront).
5. `terraform output` y copia los valores a las variables del environment `production` de GitHub
   (`S3_BUCKET`, `CF_DISTRIBUTION_ID`, `AWS_ROLE_ARN`, `AWS_REGION`).

El estado local (`terraform.tfstate`) puede contener datos sensibles: está en `.gitignore`; respáldalo o migra a S3.

## Coste aproximado

S3 y CloudFront para este tráfico: centavos al mes (CloudFront tiene capa gratuita). Route 53 cobra ~0,50 USD/mes
por zona, que ya existe. `PriceClass_100` limita la distribución a los edge más baratos.
