import dotenv from 'dotenv';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';

dotenv.config();

interface ServerConfig {
  port: number;
}

interface DatabaseConfig {
  driverClassName: string;
  url: string;
  username: string;
  password: string;
}

interface AppConfig {
  name: string;
  version: string;
}

interface Config {
  server: ServerConfig;
  datasource: DatabaseConfig;
  app: AppConfig;
}

function loadLocalConfig(): Config {
  const configFile = 'application-local.yml';
  if (fs.existsSync(configFile)) {
    try {
      const fileContents = fs.readFileSync(configFile, 'utf8');
      console.log(`Loading config from ${configFile}`);
      return yaml.load(fileContents) as Config;
    } catch (error) {
      console.error(`Error loading config from ${configFile}:`, error);
      return getDefaultConfig();
    }
  } else {
    console.log(`${configFile} not found, using default configuration`);
    return getDefaultConfig();
  }
}

function getDefaultConfig(): Config {
  return {
    server: {
      port: parseInt(process.env.PORT || '8080', 10)
    },
    datasource: {
      driverClassName: 'org.postgresql.Driver',
      url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/dealer_management',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password'
    },
    app: {
      name: 'dealer-management-system',
      version: '1.0.0'
    }
  };
}

function getConfigValue(config: Config, key: string, defaultValue: any = null): any {
  const parts = key.split('.');
  let current: any = config;
  
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return defaultValue;
    }
  }
  
  return current;
}

export const config = loadLocalConfig();
export { getConfigValue };
