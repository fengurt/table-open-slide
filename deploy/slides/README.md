# slides.opcglobal.cn deployment

Self-hosts the **docx-studio** (`html-lab`) container on **opc-hom-01**
(Tencent Lighthouse, `119.45.123.57`, ap-nanjing, x86_64 / 8 GB).

## Topology

```
slides.opcglobal.cn  ──DNS A──▶  119.45.123.57
        │
   host nginx (:443, certbot TLS)  ──proxy──▶  127.0.0.1:3333  (slides-studio container)
```

The box terminates TLS with **host nginx + certbot** and runs ~20 apps as
loopback containers. We follow that convention (not the bundled Caddy proxy):
the container binds `127.0.0.1:3333`, a new nginx vhost fronts it.

## Files

| File | Role |
| --- | --- |
| `docker-compose.slides.yml` | prod compose — image `table-slides01-docx-studio:latest`, binds `127.0.0.1:3333`, persistent `slides_out` volume, retention sweeper |
| `nginx-slides.opcglobal.cn.conf` | host nginx vhost → `127.0.0.1:3333` (certbot adds the 443 block) |
| `.env.example` | server-side env template (token, admin pw, LLM keys) |
| `deploy.sh` | one-shot: build amd64 → ship (`docker save \| ssh docker load`) → run → nginx → certbot → verify |
| `configure-tongyi.sh` | 1Password → admin API: set Tongyi `qwen3.7-max` + smoke test |

## Deploy

```bash
# from repo root, with ~/.ssh/config alias `opchom`
./deploy/slides/deploy.sh

# reuse the already-built local image
SKIP_BUILD=1 ./deploy/slides/deploy.sh

# DNS not propagated yet? skip the cert step, run it later
SKIP_TLS=1 ./deploy/slides/deploy.sh
```

## DNS

Managed in Tencent **DNSPod** (`opcglobal.cn`):

```bash
tccli dnspod CreateRecord --Domain opcglobal.cn --SubDomain slides \
  --RecordType A --RecordLine 默认 --Value 119.45.123.57
```

## Tongyi LLM (1Password)

```bash
./deploy/slides/configure-tongyi.sh
```

Reads the Bailian Token Plan seat key (`sk-sp-…`) via `op`, saves provider
`qwen3.7-max` through `/admin` (persisted on the `slides_out` volume), and
runs `/api/docx/admin/llm/test`. The key never touches git or server `.env`.

## HTML guizang decks

- Bundled demo: `/project/guizang-atelier-demo` (12-slide Atelier showcase in image)
- Agent decks: `slides/projects/<name>/` mounted via `slides_decks` volume
- Ship a deck: `rsync -av slides/projects/<name>/ opchom:/var/lib/docker/volumes/slides_slides_decks/_data/<name>/`

## Notes

- `DOCX_STUDIO_TOKEN` is generated on first deploy and stored only in
  `/opt/slides/.env` on the server (never committed). Re-deploys keep it.
- Container is loopback-only; the only public surface is the nginx vhost.
- Logs: `ssh opchom 'docker logs -f slides-studio'`.
