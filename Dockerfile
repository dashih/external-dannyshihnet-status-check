FROM public.ecr.aws/lambda/nodejs:18
COPY . ${LAMBDA_TASK_ROOT}
CMD [ "index.handler" ]