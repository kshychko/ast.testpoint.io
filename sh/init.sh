#!/bin/bash

eval $(ssh-agent -s)
ssh-add ~/.ssh/id_rsa
ssh-keyscan -H github.com > /etc/ssh/ssh_known_hosts

cd /opt
git clone git@github.com:ausdigital/ausdigital.github.io.git
git clone git@github.com:ausdigital/ausdigital-bill.git
git clone git@github.com:ausdigital/ausdigital-code.git
git clone git@github.com:ausdigital/ausdigital-dcp.git
git clone git@github.com:ausdigital/ausdigital-dcl.git
git clone git@github.com:ausdigital/ausdigital-idp.git
git clone git@github.com:ausdigital/ausdigital-nry.git
git clone git@github.com:ausdigital/ausdigital-syn-xml.git
git clone git@github.com:ausdigital/ausdigital-syn-json.git
git clone git@github.com:ausdigital/ausdigital-syn-sol.git
git clone git@github.com:ausdigital/ausdigital-tap.git
git clone git@github.com:ausdigital/ausdigital-tap-gw.git
cp -rf /opt/ausdigital.github.io/. /srv/jekyll
cd /srv/jekyll
BUNDLE_SPECIFIC_PLATFORM=true bundle install
bundle exec jekyll build
rm -rf /srv/jekyll/*

echo -e "init complete"
