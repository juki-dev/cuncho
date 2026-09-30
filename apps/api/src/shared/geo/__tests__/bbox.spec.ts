import { InvalidBBoxError, parseBBox } from '../bbox';

describe('parseBBox', () => {
  it('parsea minLng,minLat,maxLng,maxLat', () => {
    expect(parseBBox('-75.53, 5.05,-75.49,5.09')).toEqual({ minLng: -75.53, minLat: 5.05, maxLng: -75.49, maxLat: 5.09 });
  });

  it.each([
    ['', 'formato'],
    ['1,2,3', 'formato'],
    ['a,1,2,3', 'no numéricos'],
    ['-75.4,5.05,-75.5,5.09', 'mínimos'],
    ['-190,5,-75,6', 'longitud'],
    ['-75,-95,-74,6', 'latitud'],
    ['-80,0,-70,10', 'demasiado grande'],
  ])('rechaza %p (%s)', (raw, msg) => {
    expect(() => parseBBox(raw)).toThrow(InvalidBBoxError);
    expect(() => parseBBox(raw)).toThrow(new RegExp(msg));
  });
});
