import db from '../models/index.cjs';


const cache = {
    globalEntities: null,
    lastFetched: null,
    cacheDuration: 3600000, // Cache duration in milliseconds (1 hour)
};

const fetchGlobalEntitiesWithCache = async (req, res, next) => {
    try {
        const now = Date.now();

        // Check if the cache is still valid
        if (cache.globalEntities && (now - cache.lastFetched < cache.cacheDuration)) {
            res.locals.globalEntities = cache.globalEntities; // Use cached data
            return next();
        }
        
        const categories = (await db.Category.findAll({
            attributes: ['id', 'name', 'slug', 'image_url'], // Select relevant fields
        })).map(category => ({
            id: category.id,
            name: category.name,
            slug: category.slug,
            image_url: category.image_url
        }));

        

        // Update the cache
        cache.globalEntities = {
            categories,
        };
        cache.lastFetched = now;

        // Attach to res.locals for use in Handlebars
        res.locals.globalEntities = cache.globalEntities;
        next();
    } catch (error) {
        console.error('Error fetching global entities with cache:', error);
        next(error);
    }
};

export default fetchGlobalEntitiesWithCache;
