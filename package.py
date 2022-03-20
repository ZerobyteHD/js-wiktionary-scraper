import shutil
import os
import subprocess

build_folder = "build"
build_cache = "build-cache"

copy_files = ["LICENSE", "package.json", "README.md"]

#building the CJS file
data = ""
with open("src/index.ts", "r", encoding="UTF-8") as fs:
    data = fs.read()
data = data.replace('import fetch from "node-fetch";', 'import fetch from "node-fetch2";')
with open(build_cache+"/index.ts", "w", encoding="UTF-8") as fs:
    fs.write(data)

if os.path.exists(build_folder+"/index.cjs"):
    os.remove(build_folder+"/index.cjs")
subprocess.call(["tsc", "--project", "cjs.tsconfig.json", "--outDir", build_folder], shell=True)
os.rename(build_folder+"/index.js", build_folder+"/index.cjs")

#building the es6 file
subprocess.call(["tsc", "--project", "es6.tsconfig.json", "--outDir", build_folder], shell=True)

#copy other files
for file in copy_files:
    shutil.copy(file, build_folder+"/"+file)