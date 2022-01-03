exports.name = "shuffle"
exports.before = ["render"]
exports.startup = function() {
  $tw.modules.execute('$:/plugins/mklauber/shuffle/seedrandom.js');
}
