#!/usr/bin/env bash
# Prepara el servidor (Ubuntu 24.04). Lo ejecuta Lightsail como launch script (root) en cada
# instancia nueva, incluida la que crea un cambio de plan. Es idempotente.
# Requiere: DEPLOY_PUBKEY (llave pública del usuario deploy).
# Lightsail ejecuta el launch script con sh (dash), que no soporta pipefail: reejecutar con bash.
[ -n "${BASH_VERSION:-}" ] || exec bash "$0" "$@"
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

: "${DEPLOY_PUBKEY:?falta DEPLOY_PUBKEY}"
APP_DIR=/opt/cuncho
DATA_LABEL=cuncho-data
log() { echo "[bootstrap] $*"; }

# --- Paquetes y Docker --------------------------------------------------------
apt-get update -y
apt-get install -y ca-certificates curl gnupg ufw fail2ban unattended-upgrades
if ! command -v docker >/dev/null; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    >/etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
fi
cat >/etc/docker/daemon.json <<'JSON'
{ "log-driver": "json-file", "log-opts": { "max-size": "10m", "max-file": "3" } }
JSON
systemctl enable --now docker
systemctl restart docker

# --- Swap (1 GB de RAM es justo para Postgres + Node) ---------------------------
if ! swapon --show | grep -q /swapfile; then
  [ -f /swapfile ] || { fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile; }
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >>/etc/fstab
fi
echo 'vm.swappiness=20' >/etc/sysctl.d/90-cuncho.conf && sysctl -p /etc/sysctl.d/90-cuncho.conf >/dev/null

# --- Usuario deploy -------------------------------------------------------------
id deploy &>/dev/null || adduser --disabled-password --gecos "" deploy
usermod -aG docker deploy # equivale a root sobre el host: la llave de deploy es sensible
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
echo "$DEPLOY_PUBKEY" >/home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys && chmod 600 /home/deploy/.ssh/authorized_keys

# --- Disco de datos en /opt/cuncho ----------------------------------------------
# Lo adjunta Terraform después de crear la instancia: se espera hasta 10 min.
# Es el único disco sin particiones y sin montar (el del sistema tiene particiones).
find_data_disk() {
  local d
  for d in $(lsblk -dpno NAME,TYPE | awk '$2=="disk"{print $1}'); do
    [ "$(lsblk -no NAME "$d" | wc -l)" -eq 1 ] && ! mountpoint -q "$d" && { echo "$d"; return; }
  done
}
DATA_DEV=""
for _ in $(seq 1 120); do
  DATA_DEV=$(find_data_disk || true)
  [ -n "$DATA_DEV" ] && break
  sleep 5
done
[ -n "$DATA_DEV" ] || { log "no apareció el disco de datos"; exit 1; }
# Solo se formatea si está vacío: tras un cambio de plan trae los datos anteriores.
blkid "$DATA_DEV" >/dev/null 2>&1 || mkfs.ext4 -L "$DATA_LABEL" "$DATA_DEV"
install -d "$APP_DIR"
grep -q "LABEL=$DATA_LABEL" /etc/fstab || echo "LABEL=$DATA_LABEL $APP_DIR ext4 defaults,nofail 0 2" >>/etc/fstab
mountpoint -q "$APP_DIR" || mount "$APP_DIR"
install -d -o deploy -g deploy "$APP_DIR/data" "$APP_DIR/scripts"
install -d -o 999 -g 999 -m 700 "$APP_DIR/data/postgres" # uid de postgres en la imagen postgis
install -d "$APP_DIR/data/caddy-data" "$APP_DIR/data/caddy-config"
chown deploy:deploy "$APP_DIR"

# --- Claves de host SSH persistentes ----------------------------------------------
# Así SSH_KNOWN_HOSTS en GitHub sigue válido tras reemplazar la instancia.
if ls "$APP_DIR"/.ssh-host-keys/ssh_host_* >/dev/null 2>&1; then
  cp -p "$APP_DIR"/.ssh-host-keys/ssh_host_* /etc/ssh/
else
  install -d -m 700 "$APP_DIR/.ssh-host-keys"
  cp -p /etc/ssh/ssh_host_* "$APP_DIR/.ssh-host-keys/"
fi

# --- SSH, firewall, fail2ban, actualizaciones --------------------------------------
cat >/etc/ssh/sshd_config.d/10-cuncho.conf <<'SSHD'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin no
AllowUsers deploy ubuntu
SSHD
sshd -t && systemctl restart ssh

ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

systemctl enable --now fail2ban
echo 'APT::Periodic::Update-Package-Lists "1"; APT::Periodic::Unattended-Upgrade "1";' >/etc/apt/apt.conf.d/20auto-upgrades

# Backup diario 07:17 UTC (02:17 en Colombia).
cat >/etc/cron.d/cuncho-backup <<CRON
17 7 * * * deploy $APP_DIR/scripts/backup.sh >> $APP_DIR/backup.log 2>&1
CRON
chmod 644 /etc/cron.d/cuncho-backup

# --- Si ya hay una versión desplegada (cambio de plan), levantarla -----------------
if [ -f "$APP_DIR/.tag.env" ] && [ -f "$APP_DIR/.env" ] && [ -f "$APP_DIR/docker-compose.prod.yml" ]; then
  log "levantando la versión existente"
  sudo -u deploy bash -c "cd $APP_DIR && docker compose --env-file .env --env-file .tag.env -f docker-compose.prod.yml up -d"
fi
log "listo"
