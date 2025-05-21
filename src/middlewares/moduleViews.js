// src/middleware/moduleViews.js

import path from 'path';
import fs from 'fs';
import { engine } from 'express-handlebars';
import * as Allow from '@handlebars/allow-prototype-access';
import Handlebars from 'handlebars';

const allowPrototypeAccess = Allow.allowInsecurePrototypeAccess || Allow.default || Allow;

const pathCache = new Map();

export default function useModuleViews(moduleName) {
  return function (req, res, next) {
    const rootPath = path.resolve();
    const moduleViewsPath = path.join(rootPath, 'src', 'modules', moduleName, 'views');
    const modulePartialsPath = path.join(moduleViewsPath, 'partials');
    const globalViewsPath = path.join(rootPath, 'src', 'views');
    const globalLayoutsPath = path.join(globalViewsPath, 'layouts');
    const globalPartialsPath = path.join(globalViewsPath, 'partials');

    if (!fs.existsSync(moduleViewsPath)) {
      return next(); // fallback to global
    }

    const cacheKey = `${moduleName}_engine`;
    if (!pathCache.has(cacheKey)) {
      // Register a dedicated engine per module with module-specific partials
      const partialDirs = [globalPartialsPath];
      if (fs.existsSync(modulePartialsPath)) {
        partialDirs.unshift(modulePartialsPath); // Module-specific partials take precedence
      }

      req.app.engine(`html`, engine({
        extname: '.html',
        defaultLayout: 'main',
        layoutsDir: globalLayoutsPath,
        partialsDir: partialDirs,
        handlebars: allowPrototypeAccess(Handlebars),
      }));

      pathCache.set(cacheKey, partialDirs);
    }

    req.app.set('views', [moduleViewsPath, globalViewsPath]); // Prioritize module views
    next();
  };
}
