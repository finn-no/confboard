module ConfBoard

  #
  # java.util.Properties-like Ruby hash
  #

  class Properties < Hash
    REGEXP = %r{
          \A\s*         # ignore whitespace at BOL
          ([^\s\#;]+?)  # the variable cannot contain spaces or comment characters
          \s*=\s*       # ignore whitespace around the equal sign
          ([^\#;]*?)    # the value cannot contain comment characters
          \s*           # ignore whitespace at end of line
          (\#|;|\z)     # the matching ends if we meet a comment character or EOL
    }x

    def self.from_string(str)
      prop = new
      prop.load(str)

      prop
    end

    def initialize(defaults = nil)
      super()

      unless [nil, Hash].any? { |e| e === defaults }
        raise TypeError, "defaults must be Properties or Hash"
      end

      stringify defaults if defaults.instance_of? Hash
      @parent = defaults
    end

    def load(string)
      string.split(/\r?\n/).each do |line|
        if line =~ REGEXP
          self[$1] = $2.strip #.split(',')
        end
      end

      self
    end

    def [](key)
      if obj = super
        obj
      elsif @parent
        @parent[key]
      end
    end

    def fetch(key)
      val = self[key]

      unless val
        if block_given?
          val = yield
        else
          raise IndexError, "key not found: #{key.inspect}"
        end
      end

      val
    end

    def []=(key, value)
      key, value = key.to_s, value
      super(key, value)
    end

    def to_s
      @parent ? @parent.merge(self).to_s : super
    end

    def inspect
      @parent ? @parent.merge(self).inspect : super
    end

    def pretty_print(q)
      @parent ? @parent.merge(self).pretty_print(q) : super
    end

    private

    def stringify(hash)
      r = {}
      hash.each do |key, value|
        r[key.to_s] = value.to_s
      end

      hash.replace r
    end
  end

end