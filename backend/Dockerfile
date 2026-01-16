# Dockerfile para Lambda Jira Handler
# Usa imagen base de AWS Lambda para Node.js
FROM public.ecr.aws/lambda/nodejs:18

# Copiar código compilado
COPY dist/functions/jiraHandler.js ${LAMBDA_TASK_ROOT}/functions/
COPY dist/lib/ ${LAMBDA_TASK_ROOT}/lib/

# Copiar dependencias
COPY node_modules/ ${LAMBDA_TASK_ROOT}/node_modules/
COPY prisma/ ${LAMBDA_TASK_ROOT}/prisma/
COPY package.json ${LAMBDA_TASK_ROOT}/

# Handler de la Lambda
CMD ["functions/jiraHandler.handler"]
