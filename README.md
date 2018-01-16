# Requisitos
```
npm install -g firebase-tools webpack
firebase login
cd functions
npm install
```
# Deploy
Compilar typescript con webpack y subir las funciones a firebase cloud functions
```
cd functions
webpack
firebase deploy --only functions
```
Si se ocupa subir solo una función, se puede especificar
```
firebase deploy --only functions:someFunction
```
