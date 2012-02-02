require 'logger'

module ConfBoard
  class CachingDelegator
    def initialize(delegate, ttl)
      @delegate = delegate
      @ttl      = ttl

      @cache       = {}
      @expirations = {}

      @log = Logger.new(STDOUT)
    end

    def method_missing(meth, *args, &blk)
      if @delegate.respond_to?(meth)
        key = "#{meth}.#{args}"

        cached = @cache[key]
        if cached && @expirations[key] >= Time.now
          @log.info "cache hit: #{key}"
          cached
        else
          @log.info "cache miss: #{key}"

          @expirations[key] = Time.now + @ttl
          val = @delegate.__send__(meth, *args, &blk)
          @cache[key] = val

          val
        end
      else
        @delegate.__send__(meth, *args, &blk)
      end
    end
  end
end

