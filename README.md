confboard
=========

App to quickly compare *.{ini,properties} files.

Usage
-----

```
$ bundle install
$ export CONFBOARD_REPOS=/path/to/repos
$ bundle exec rackup config.ru
```

Caveats
-------

The code assumes .properties files are suffixed with what would otherwise be a Constretto profile. E.g. given the following files:

* foo_dev.properties
* foo_test.properties
* foo_prod.properties

you will see one entry in the file list, with dev, test, prod as columns to compare.

Copyright
---------

Copyright (c) 2011-2012 FINN.no. See LICENSE for details.
