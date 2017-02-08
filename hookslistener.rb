#!/usr/bin/env ruby -I ../lib -I lib
require 'sinatra'
require 'json'

set :bind, '0.0.0.0'

get '/' do
  "Hello World #{params[:name]}".strip
end

post '/payload' do
  push = JSON.parse(request.body.read)
  puts "I got some JSON: #{push.inspect}"
  repoURL = push["repository"]["git_url"]
  repoName = push["repository"]["name"]
  authorEmail = push["head_commit"]["author"]["email"]
  authorName = push["head_commit"]["author"]["name"]
  commitMessage = push["head_commit"]["message"]

 "#{repoURL}, #{repoName}, #{authorEmail}, #{authorName}, #{commitMessage}".strip

	
end