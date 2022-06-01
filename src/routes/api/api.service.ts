import { Request, Response } from 'express';

export async function apiRedirectHandler(req: Request, res: Response) {
    await res.redirect('/');
}