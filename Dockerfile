# Usar a imagem oficial do Node.js
FROM node:20-alpine

# Definir diretório de trabalho dentro do container
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar o restante do código
COPY . .

# Criar a pasta de dados e dar permissões
RUN mkdir -p /app/data && chown -R node:node /app/data

# Expor a porta que a aplicação vai rodar
EXPOSE 3000

# Rodar a aplicação
CMD ["npm", "start"]
