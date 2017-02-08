#!/bin/bash

eval $(ssh-agent -s)
ssh-add ~/.ssh/id_rsa
ssh-keyscan -H github.com > /etc/ssh/ssh_known_hosts

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


git config --global user.email $COMMIT_AUTHOR_EMAIL

git config --global user.name $COMMIT_AUTHOR_EMAIL

cd /opt
if [ -d "$TARGET_REPO_NAME" ]; then
    echo -e "${TARGET_REPO_NAME} exists, no need to clone"
    else
    git clone $TARGET_REPO_URL
fi

cd /opt/$TARGET_REPO_NAME
if [ -d "specs" ]; then
    echo -e "specs directoryexists, no need to create"
    else
    mkdir "specs"
fi

cd /opt/$TARGET_REPO_NAME/specs
if [ -d "$REPO_NAME" ]; then
    rm -rf $REPO_NAME
fi

mkdir $REPO_NAME

cd /opt/
if [ -d "$REPO_NAME" ]; then
    cd /opt/$REPO_NAME
    git pull origin master
    RESULT=$?
    if [[ ${RESULT} -ne 0 ]]; then
        echo -e "\nCan't pull ${REPO_URL} to ${REPO_NAME} repo"
        exit
    fi
    else
    git clone $REPO_URL
fi

cp -rf /opt/$REPO_NAME/docs/* /opt/$TARGET_REPO_NAME/specs/$REPO_NAME/

cd /opt/$TARGET_REPO_NAME

git add --all

git commit -m "$COMMIT_MESSAGE"

git pull --rebase

git push origin master