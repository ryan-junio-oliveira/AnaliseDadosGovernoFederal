"""Atualiza tudo em um comando: RTN + SIOP mais recentes -> reprocessa -> re-exporta JSONs.
Uso:  python scripts/atualizar.py   (rode a partir da raiz do projeto)
"""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPTS = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPTS))
from coleta import coleta_rtn

print("=== 1/4 baixando RTN mais recente ===")
coleta_rtn()
print("=== 2/4 reprocessando serie historica (RTN) ===")
subprocess.run([sys.executable, str(SCRIPTS / "processa_rtn.py")], check=True, cwd=ROOT)
print("=== 3/4 coletando orgaos SIOP (todos os Poderes) ===")
subprocess.run([sys.executable, str(SCRIPTS / "coleta_orgaos_todos.py"),
                "2022", "2023", "2024", "2025", "2026"], check=True, cwd=ROOT)
print("=== 4/4 exportando JSONs p/ public/data ===")
subprocess.run([sys.executable, str(SCRIPTS / "export_json.py")], check=True, cwd=ROOT)
print("OK: dados atualizados. Rode o app (rodar.bat) para ver.")
