import express, {Request, Response} from 'express'
import { WKODbAccess} from "../../data/WKODbAccess";
import {DbConfig} from "../../config"
import {jwtSecret} from "../../config";
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';

const dao = new WKODbAccess(DbConfig);
const ArchiveController = express.Router();

export default ArchiveController;

