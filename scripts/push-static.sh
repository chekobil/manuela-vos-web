# comprueba que estas en raiz
FILE="package.json"
if [ ! -f "$FILE" ]; then
    echo "Wrong directory, cd to the $FILE location"
fi

# elimina builds anteriores
rm -rf dist dist-repo
# crea una carpeta y trae el repo remoto
mkdir dist-repo
cd dist-repo
git init
git remote add origin git@github.com:chekobil/manuela-vos-static.git
git pull origin main
# haz un nuevo build, se genera en dist
cd ..
# deshabilita ruta AUTH
bash scripts/disable_auth.sh disable
npm run build
# convierte dist en el nuevo repo copiando la carpeta .git
cp -a dist-repo/.git/. dist/.git/
# copia los archivos que no se generan en el build
cp dist-repo/.gitignore dist/
cp dist-repo/README.md dist/
# elimina el repo, ahora el repo esta en dist
rm -rf dist-repo
# en el repo nuevo, actualizas README, OJO es un markdown
cd dist
DATETIME=$(date +'%F_%R')
echo -e "- [${DATETIME}] some changes\n" >> README.md
# commit con todos los cambios y haces push
git add .
git commit -m "some changes [${DATETIME}]"
git push origin main