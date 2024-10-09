"use strict";
const minURL = require("minurl");


const deepFreeze = object =>
	{
		if (object)
	{
			let property;
			object = Object.freeze(object);
			const propNames = Reflect.ownKeys(object);
			for (const propertyKey of propNames)
	{
				property = object[propertyKey];
				if (
					typeof property !== "object" ||
					!(property instanceof Object) ||
					Object.isFrozen(property)
				)
	{
					continue;
				}
				deepFreeze(property);
			}
		}
		return object;
	};


const DEFAULT_OPTIONS =
{
	carefulProfile: { ...minURL.CAREFUL_PROFILE, removeHash:true },
	commonProfile:  { ...minURL.COMMON_PROFILE,  removeHash:true },
	maxAge: Infinity,
	profile: "common"
};



const formatURL = (url, instanceOptions, customOptions={}) =>
{
	const profileName = `${ customOptions.profile ?? instanceOptions.profile }Profile`;
	const profile = customOptions[profileName] ?? instanceOptions[profileName];

	return minURL(url, profile);
};



const remove = (instance, url) =>
{
	if (url in instance.values)
	{
		delete instance.ages[url];
		delete instance.values[url];

		instance.count--;
	}
};



const removeExpired = (instance, url) =>
{
	if (instance.ages[url] < Date.now())
	{
		remove(instance, url);
	}
};



class URLCache
{
	constructor(options)
	{
		this.options = { ...DEFAULT_OPTIONS, ...options };

		this.clear();
	}



	clean()
	{
		Object.keys(this.ages).forEach(url => removeExpired(this, url));
	}



	clear()
	{
		this.ages = {};
		this.count = 0;
		this.values = {};
	}



	delete(url)
	{
		remove(this, formatURL(url, this.options));
	}



	get(url)
	{
		url = formatURL(url, this.options);

		removeExpired(this, url);

		return this.values[url];
	}



	has(url)
	{
		url = formatURL(url, this.options);

		removeExpired(this, url);

		return url in this.values;
	}



	get length()
	{
		return this.count;
	}



	// @todo `url, headers, value, options` ... key can be a hash from url and headers
	// see https://github.com/ForbesLindesay/http-basic/issues/24#issuecomment-293630902
	set(url, value, options={})
	{
		url = formatURL(url, this.options, options);

		if (!(url in this.values))
		{
			this.count++;
		}

		this.ages[url] = Date.now() + (options.maxAge ?? this.options.maxAge);
		this.values[url] = value;
	}
}



URLCache.DEFAULT_OPTIONS = DEFAULT_OPTIONS;



module.exports = deepFreeze(URLCache);
