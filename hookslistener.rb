#!/usr/bin/env ruby -I ../lib -I lib
require 'sinatra'
require 'json'

set :bind, '0.0.0.0'

get '/' do
  "Hello World #{params[:name]}".strip
end

post '/payload' do
  eventType = request.headers["X-GitHub-Event"];

  push = JSON.parse(request.body.read)
  puts "I got some JSON: #{push.inspect}"
  repoURL = push["repository"]["git_url"]
  repoName = push["repository"]["name"]
  authorEmail = push["head_commit"]["author"]["email"]
  authorName = push["head_commit"]["author"]["name"]
  commitMessage = push["head_commit"]["message"]

 system("sh sh/git-pull.sh"
	+ ' -n ' + repoName
	+ ' -u ' + repoURL
	+ ' -a "' + authorName + '"'
	+ ' -b ' + authorEmail
	+ ' -c "' + commitMessage + '"'
	+ ' -t ' + 'ausdigital.github.io'
	+ ' -r ' + 'git@github.com:k.shychko/ausdigital.github.io.git')
  

 "#{eventType} #{repoURL}, #{repoName}, #{authorEmail}, #{authorName}, #{commitMessage}".strip

	
end