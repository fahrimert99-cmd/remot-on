"""Hugging Face Space köprüsü: ltx/jobs/*.json işlerini çalıştırır, sonuçları ltx/results/ altına yazar.

GitHub Actions üzerinde çalışır (bkz. .github/workflows/ltx-space.yml).
Bitmiş işler (results/<ad>.done) tekrar çalıştırılmaz.

İş dosyası örnekleri:
  {"type": "discover"}                              -> Space'in API şemasını results/<ad>.api.json'a yazar
  {"api_name": "/generate", "args": [...], "kwargs": {...}}
      args/kwargs içinde {"file": "remotion-studio/public/elif/front.png"} biçimindeki değerler
      dosya olarak yüklenir.
"""

import json
import os
import shutil
import sys
import traceback
from pathlib import Path

from gradio_client import Client, handle_file

ROOT = Path(__file__).resolve().parent
JOBS = ROOT / "jobs"
RESULTS = ROOT / "results"
REPO = ROOT.parents[1]
DEFAULT_SPACE = "amisima/LTX-2.3-Studio"


def resolve(v):
    """{"file": yol} değerlerini Space'e yüklenecek dosyaya çevir."""
    if isinstance(v, dict) and set(v) == {"file"}:
        return handle_file(str(REPO / v["file"]))
    if isinstance(v, list):
        return [resolve(x) for x in v]
    if isinstance(v, dict):
        return {k: resolve(x) for k, x in v.items()}
    return v


def collect_files(result, out):
    """Sonuç içindeki dosya yollarını (video/ses/görsel) bul."""
    if isinstance(result, str) and os.path.isfile(result):
        out.append(result)
    elif isinstance(result, dict):
        for k in ("video", "path", "value", "name"):
            if k in result:
                collect_files(result[k], out)
    elif isinstance(result, (list, tuple)):
        for x in result:
            collect_files(x, out)
    return out


def main():
    RESULTS.mkdir(exist_ok=True)
    token = os.environ.get("HF_TOKEN") or None
    clients = {}
    for job_file in sorted(JOBS.glob("*.json")):
        name = job_file.stem
        if (RESULTS / f"{name}.done").exists():
            continue
        job = json.loads(job_file.read_text())
        space = job.get("space", DEFAULT_SPACE)
        log = RESULTS / f"{name}.log.txt"
        print(f"== {name} ({space})", flush=True)
        try:
            if space not in clients:
                clients[space] = Client(space, hf_token=token, verbose=False)
            client = clients[space]
            if job.get("type") == "discover":
                api = client.view_api(return_format="dict", print_info=False)
                (RESULTS / f"{name}.api.json").write_text(json.dumps(api, indent=2, ensure_ascii=False))
                log.write_text("API şeması kaydedildi.\n")
            else:
                result = client.predict(
                    *resolve(job.get("args", [])),
                    api_name=job["api_name"],
                    **resolve(job.get("kwargs", {})),
                )
                files = collect_files(result, [])
                for i, f in enumerate(files):
                    ext = Path(f).suffix or ".bin"
                    dst = RESULTS / (f"{name}{ext}" if i == 0 else f"{name}-{i}{ext}")
                    shutil.copy(f, dst)
                log.write_text(f"Sonuç: {json.dumps(result, default=str, ensure_ascii=False)[:4000]}\n")
            (RESULTS / f"{name}.done").write_text("ok\n")
        except Exception:
            # Hata kaydedilir; .done yazılmadığı için iş bir sonraki çalıştırmada yeniden denenir
            log.write_text(traceback.format_exc())
            print(traceback.format_exc(), file=sys.stderr)


if __name__ == "__main__":
    main()
