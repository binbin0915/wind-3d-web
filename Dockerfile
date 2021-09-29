# 基于远景智能基础镜像构建
FROM harbor.eniot.io/envisioniot/java8_tomcat8:latest
MAINTAINER zhipeng.wang <zhipeng.wang@envision-digital.com>

# 定义环境变量
ENV APP_NAME eos-wind-3d-web
ENV APP_HOME /home/envuser/eos-wind-3d-web

COPY eoswind3dweb /home/envuser/tomcat/webapps/eoswind3dweb
COPY ./startup.sh $APP_HOME/


# 指定工作目录
WORKDIR $APP_HOME/

# 执行命令，改变文件权限
RUN chmod 755 startup.sh

# 指定容器启动程序及参数
ENTRYPOINT ["bash","./startup.sh"]