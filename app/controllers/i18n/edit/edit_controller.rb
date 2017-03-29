require 'yaml'
require_dependency 'i18n/edit/application_controller'


module I18n::Edit
  class EditController < ApplicationController
  private
    skip_before_action :verify_authenticity_token
    before_action :security_check

    def self.traverse(key_locations, path, prefix, h)
      h.each do |key, value|
        if value.is_a?(String) || value.is_a?(Integer) || value.is_a?(Float) || value.is_a?(TrueClass) || value.is_a?(FalseClass) || value.is_a?(Symbol)
          key_locations[(prefix + key).to_sym] = path
        elsif value.is_a?(Hash) || value.is_a?(Array)
          p = prefix.blank? ? "#{key}." : "#{prefix}#{key}."
          traverse(key_locations, path, p, value)
        else
          raise "Locale value for #{prefix}#{key} is #{value.class.name}"
        end
      end
    end
    
    def self.set_key_locations
      key_locations = {}
      I18n.load_path.each do |path|
        next if path.index(Rails.root.to_s) != 0
        f = nil
        begin
          f = File.read(path)
        rescue => exception
          logger.info("#{path}: #{exception.inspect}")
        end
        next unless f
        n = YAML.parse(f).to_ruby
        l = n[I18n.locale.to_s]
        traverse(key_locations, path, '', l) if l
      end
      key_locations
    end

    KeyLocations = set_key_locations

    def token_valid?(params, extra_message='')
      if params[:token] != I18n::Edit::Token
        render plain: "Bad security token, reload the page to synchronize. #{extra_message}", status: 202, layout: false
        return false
      else
        return true
      end
    end

    def write_file(path, key, old_text, text)
      file = File.open(path)
      yaml_data = file.read
      container = parsed_data = YAML.parse(yaml_data).to_ruby
      hashes_path = [I18n.locale.to_s] + key.split('.')
      hashes_path[0...-1].each do |k|
        container = container[k]
      end
      old_text_in_file = container[hashes_path[-1]]
      if old_text != old_text_in_file
        render plain: "The old text in the file is #{old_text_in_file.inspect}, while " \
         "the old text from the browser is #{old_text.inspect}, they don't match. " \
         'Refusing to write with inconsistent data. ' \
         "Your edit wasn't written.", layout: false, status: 201
        return false
      end
      container[hashes_path[-1]] = text
      new_file_path = path + '.i18n_edit_new'
      old_file_path = path + '.i18n_edit_old'
      new_file = File.new(new_file_path, File::NOFOLLOW | File::CREAT | File::TRUNC | File::WRONLY, file.stat.mode & 0o777)
      new_file.write(parsed_data.to_yaml)
      new_file.fsync
      begin
        File.unlink(old_file_path)
      rescue
      end
      File.link(path, old_file_path)
      File.rename(new_file_path, path)
      return true
    end

  protected
    def security_check
      if ENV['I18N_EDIT'].nil?
        render plain: "I18_EDIT is not set in the environment.", status: 201
        return false
      elsif !token_valid?(params)
        return false
      end
      return true
    end

  public
  
    def check_token
      render plain: 'OK', status: 200, layout: false
    end
  
    def menu
      @style = "top: #{params[:y]}px; left: #{params[:x]}px;"
      @i18n = JSON.parse(params[:i18n])

      render 'menu', layout: false
    end

    def update
      key = params[:key]
      text = params[:text]
      old_text = params[:old_text]
      path = KeyLocations[key.to_sym]
  
      if text.gsub(/\s/, '').blank?
        render plain: "Erasing the entire locale text isn't allowed.", layout: false, status: 202
        return
      end
  
      if path.nil?
        render plain: "No locale file in your project for #{key}, your edit was not written.", layout: false, status: 201
        return
      end
  
      return if !write_file(path, key, old_text, text)
  
      message = "Wrote #{path} for #{key}"
      logger.info(message)
      render plain: message, layout: false, status: 200
    end
  end
end
