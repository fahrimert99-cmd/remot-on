# Remotion Stüdyo

Kodla üretilen videolar: Remotion (React) + Three.js + Python ile sentezlenen müzik.

## Kompozisyonlar

| Kimlik | İçerik | Süre |
|---|---|---|
| `Showcase` | 7 sahnelik Remotion gösterisi (3D, veri, üretken sanat, şekiller, kod) | 31 sn |
| `Gercekci` | Gerçekçi 3D: dağlarda gün batımı, gece şehri, şafakta zirveler | 25 sn |
| `Pitir` | Pixar tarzı kısa film: "Pıtır ile Kelebek" | 10 sn |
| `Elif` | "Elif ve Uçan Balon" hikâye kitabı fragmanı (karakter sayfasından kesilen pozlar) | 30 sn |

Hazır videolar `videolar/` klasöründe.

## Kurulum

```bash
cd remotion-studio
npm install
npm run dev                                       # Studio: http://localhost:3000
npx remotion render Pitir out/pitir.mp4           # tek seferde üretim
scripts/render-chunks.sh Pitir 300 public/pitir.wav out/pitir.mp4   # parça parça, kesintiye dayanıklı
```

## Müzik

Sesler internet ve hazır dosya kullanmadan Python ile sentezlenir:

```bash
pip install numpy scipy
python scripts/soundtrack.py public/soundtrack.wav   # Gercekci
python scripts/pitir_music.py public/pitir.wav       # Pitir
python scripts/elif_music.py public/elif.wav         # Elif
```

## Hugging Face Space köprüsü (`ltx/`)

GitHub Actions, `ltx/jobs/` altına eklenen her iş dosyası için Hugging Face Space'ini
(varsayılan: `amisima/LTX-2.3-Studio`) çağırır ve sonucu `ltx/results/` altına kaydeder.

1. Hugging Face → Settings → Access Tokens: **Read** yetkili bir anahtar oluşturun.
2. GitHub → bu depo → Settings → Secrets and variables → Actions: `HF_TOKEN` adıyla ekleyin.
3. `ltx/jobs/` altına iş dosyası ekleyip gönderin (biçim için `ltx/run_jobs.py` başındaki açıklamaya bakın).
