module.exports = function(api) {
  api.cache(true);
  const isMetro = api.caller(caller => caller && caller.name === 'metro');
  if (!isMetro) return {};
  return {
    presets: ['babel-preset-expo'],
  };
};
