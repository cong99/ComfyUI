import subprocess
import os
from datetime import date

current_path = os.path.abspath(__file__)
current_dir = os.path.dirname(current_path)
lock_file_name = 'requirements.lock'
lock_file = os.path.join(current_dir, lock_file_name)


def check():
    if os.path.exists(lock_file):
        print('has installed.')
        return

    print('prepare to install requirements.')
    os.chdir(current_dir)
    result = subprocess.run('pip install -r requirements.txt', stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                            text=True)

    print(result.stdout)
    if result.stderr:
        print(result.stderr)

    if result.returncode == 0:
        with open(lock_file, 'w') as file:
            file.write(str(date.today()))
        print(f'install success.')
    else:
        print(f'install failed.')

check()

