# encoding: utf-8

require 'rubygems'
require 'sinatra/base'

require 'json'
require 'set'
require 'enumerator'
require 'iniparse'

require 'confboard/properties'
require 'confboard/config_reader'
require 'confboard/caching_delegator'

module ConfBoard
  class App < Sinatra::Base

    set :root, File.expand_path('..', __FILE__)
    set :public_folder, "#{settings.root}/confboard/public"
    set :views, "#{settings.root}/confboard/views"
    set :repos, ENV['CONFBOARD_REPOS'] || "/finntech/iad"
    set :conf, CachingDelegator.new(ConfigReader.new(settings.repos), 60*60)
    set :logging, true
    set :dump_errors, true

    before do
      content_type :json
    end

    helpers do
      def root
        request.script_name
      end
    end

    get "/" do
      content_type :html
      erb :index
    end

    get "/configs" do
      settings.conf.all_configs.to_json
    end

    get "/config" do
      name = params[:name]
      properties = settings.conf.properties_for(name)

      all_keys  = Set.new
      all_files = Set.new

      properties.each do |path, prop|
        all_files << path
        all_keys += prop.keys
      end

      sorted_keys = all_keys.to_a.sort
      sorted_files = all_files.to_a.sort

      keys = sorted_keys.enum_for(:map).with_index do |key, idx|
        files = sorted_files.map do |path|
          {:value => properties.fetch(path)[key]}
        end

        {
          :name => key,
          :files => files,
          :class => (idx % 2 == 0) ? '' : 'odd',
        }
      end

      {
        :files => sorted_files.map { |e| {:name => File.basename(e, ".properties")} },
        :keys => keys,
        :name => name
      }.to_json
    end

  end # App
end # ConfBoard
