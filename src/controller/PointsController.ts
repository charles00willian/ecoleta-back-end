
import knex from '../database/connection';
import { Request, Response, response } from 'express';

class PointsController {

  async index (req: Request, res: Response){
    const { city, uf, items} = req.query;

    const parsedItems = String(items)
      .split(',')
      .map(item => Number(item.trim()));

    const points = await knex('points')
      .join('point_items', 'points.id', '=', 'point_items.point_id')
      .whereIn('point_items.item_id', parsedItems)
      .where('city', String(city))
      .where('uf', String(uf))
      .distinct()
      .select('points.*')

    return res.json(points);
  }

  async show (req: Request, res: Response){
    const {id} = req.params;
    const point = await knex('points').where('id', id).first();

    if(!point){
      return res.status(400).json({message: 'Point not found'});
    }

    const items = await knex('items')
      .join('point_items', 'item_id', '=', 'point_items.item_id')
      .where('point_items.point_id', id)
      .select('items.title')

    return res.json({point, items});
  }

  async create (request: Request, response: Response) {
    const {
      name, 
      email,
      whatsapp,
      latitude,
      longitude,
      city,
      uf,
      items
    } = request.body;
  
    const trx = await knex.transaction()

    const point = {
      image: 'image-fake',
      name,
      email,
      whatsapp,
      latitude,
      longitude,
      city,
      uf,
    };
  
    const insertedIds = await trx('points').insert(point);
  
    const point_id=insertedIds[0]
  
    const pointItems = items.map((item_id: number) => {
      return {
        item_id,
        point_id,
      }
    })
  
    await trx('point_items').insert(pointItems);

    await trx.commit();
  
    return response.json({id: point_id, ...point})
  }
}

export default PointsController