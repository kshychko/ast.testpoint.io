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
end