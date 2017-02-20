#!/bin/bash

# Parse options
while getopts ":n:m:u:t:r:a:b:c:" opt; do
    case $opt in
        n)
            echo -e "\nREPO_NAME: -${OPTARG}"
            REPO_NAME="${OPTARG}"
            ;;
        u)
            echo -e "\nREPO_URL: -${OPTARG}"
            REPO_URL="${OPTARG}"
            ;;
        t)
            echo -e "\nTARGET_REPO_NAME: -${OPTARG}"
            TARGET_REPO_NAME="${OPTARG}"
            ;;
        r)
            echo -e "\nTARGET_REPO_URL: -${OPTARG}"
            TARGET_REPO_URL="${OPTARG}"
            ;;
        a)
            echo -e "\nCOMMIT_AUTHOR_NAME: -${OPTARG}"
            COMMIT_AUTHOR_NAME="${OPTARG}"
            ;;
        b)
            echo -e "\nCOMMIT_AUTHOR_EMAIL: -${OPTARG}"
            COMMIT_AUTHOR_EMAIL="${OPTARG}"
            ;;
        c)
            echo -e "\nCOMMIT_MESSAGE: -${OPTARG}"
            COMMIT_MESSAGE="${OPTARG}"
            ;;
        \?)
            echo -e "\nInvalid option: -${OPTARG}"
            usage
            ;;
        :)
            echo -e "\nOption -${OPTARG} requires an argument"
            usage
            ;;
     esac
done


git config --global user.email "specs.generator@ausdigital.org"

git config --global user.name "Specification Generator"

cd /opt
if [ -d "$TARGET_REPO_NAME" ]; then
    echo -e "${TARGET_REPO_NAME} exists, no need to clone"
    else
    git clone $TARGET_REPO_URL
fi

cd /opt/$TARGET_REPO_NAME
if [ -d "specs" ]; then
    echo -e "specs directory exists, no need to create"
    else
    mkdir "specs"
fi


## declare an array variable
REPO_NAMES=("ausdigital-bill" "ausdigital-code" "ausdigital-dcl" "ausdigital-dcp" "ausdigital-idp" "ausdigital-nry" "ausdigital-syn" "ausdigital-tap" "ausdigital-tap-gw")

## now loop through the above array
for i in "${REPO_NAMES[@]}"
do
	cd /opt/

	if [ -d "$i" ]; then
		cd /opt/$i
		git pull origin master
		RESULT=$?
		if [[ ${RESULT} -ne 0 ]]; then
			echo -e "\nCan't pull ${i} repo"
			exit
		fi
#		else
#		git clone $i
	fi
	cd /opt/$TARGET_REPO_NAME/specs
	if [ -d "$i" ]; then
		rm -rf $i
	fi

	mkdir $i

	cp -rf /opt/$i/docs/. /opt/$TARGET_REPO_NAME/specs/$i
   # or do whatever with individual element of the array
done


#cd /opt/$TARGET_REPO_NAME
rm -rf /srv/jekyll/*
cp -rf /opt/$TARGET_REPO_NAME/. /srv/jekyll
rm -rf /opt/$TARGET_REPO_NAME/specs/*


cd /srv/jekyll
BUNDLE_SPECIFIC_PLATFORM=true bundle install
RESULT=$?
if [[ ${RESULT} -ne 0 ]]; then
	echo -e "\nCan't bundle install"
	exit
fi

bundle exec jekyll build
RESULT=$?
if [[ ${RESULT} -ne 0 ]]; then
	echo -e "\nCan't bundle exec jekyll build"
	exit
fi

cp -rf /srv/jekyll/_site/specs/. /opt/$TARGET_REPO_NAME/specs

cd /opt/$TARGET_REPO_NAME

git add --all

git commit -m "update specifications pages due to commit \"$COMMIT_MESSAGE\" to \"$REPO_NAME\""

#git reset --hard HEAD

git pull --rebase

git push origin master