# encoding: utf-8

module ConfBoard
  class ConfigReader

    def initialize(dir)
      @dir = dir
    end

    def all_configs
      (groups.keys + ini_files).sort
    end

    def groups
      # this is probably pretty finn-specific..
      groups = properties_files.group_by { |e| e[/(.+?)(_\w+)?\.properties/, 1] }
      groups.delete(nil)

      groups
    end

    def properties_for(group_name)
      if File.extname(group_name) == ".ini"
        read_ini(group_name)
      else
        res = {}

        properties_files.each do |path|
          if path =~ /#{group_name}(_\w+)?\.properties/
            res[path] = read_properties(path)
          end
        end

        res
      end
    end

    def read_properties(path)
      res = {}

      Properties.from_string(read_file(path)).each do |k, v|
        res[k] = v
      end

      res
    end

    def read_ini(path)
      res = {}

      ini = IniParse.parse(read_file(path))
      ini.lines.keys.each { |key|
        section = res[key] ||= {}

        ini[key].each do |option|
          section[option.key] = option.value.to_s
        end
      }

      res
    end

    IGNORED = %r[/target/]

    def properties_files
      files_for '**/*.properties'
    end

    def ini_files
      files_for '**/*.ini'
    end

    def files_for(glob)
      Dir[absolute_path_for(glob)].map do |e|
        next if e =~ IGNORED
        relative_path_for(e)
      end.compact
    end

    def absolute_path_for(relative)
      File.join @dir, relative
    end

    def relative_path_for(absolute)
      absolute.to_s.sub(/#{@dir}\/?/, '')
    end

    # assuming config files are ISO-8859-1 may also be quite finn-specific
    if RUBY_VERSION < '1.9'
      require 'iconv'

      def read_file(path)
        content = File.read(absolute_path_for(path))
        Iconv.conv("UTF-8", "ISO-8859-1", content)
      end
    else
      def read_file(path)
        content = File.read(absolute_path_for(path), :mode => "r:ISO-8859-1")
        content.encode("UTF-8")
      end
    end

  end
end
