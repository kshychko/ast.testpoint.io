FROM jekyll/jekyll

RUN mkdir -p /root/.ssh

ADD id_rsa /root/.ssh/id_rsa

RUN chmod 700 /root/.ssh/id_rsa


ENV APP_HOME /src
ENV HOME /root
RUN mkdir $APP_HOME
RUN mkdir /opt
WORKDIR $APP_HOME
ADD . /src/
COPY Gemfile* $APP_HOME/
RUN bundle install

CMD ["ruby", "hookslistener.rb"]


EXPOSE 4567
