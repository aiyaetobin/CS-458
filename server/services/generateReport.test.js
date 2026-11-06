import { describe, it, expect } from 'vitest';
import * as generateReport from './generateReport.js';

describe('testing classifierFromIsbn' , () => {

  it('should return a valid classifier for an existing isbn', async () => {
    expect(await generateReport.classifierFromIsbn('9781433502415')).toBe('BS195 .E64 2007f');
  })
  it('should return error if the isbn is less than 10 characters', async () => {
    expect(await generateReport.classifierFromIsbn('123456789')).toBe('ISBN must be 10 or 13 characters long'
    );})

  it('should return error if the isbn is more than 13 characters', async () => {
    expect(await generateReport.classifierFromIsbn('12345678901234')).toBe('ISBN must be 10 or 13 characters long');
  })

  it('should return error if the isbn is 12 characters', async () => {
    expect(await generateReport.classifierFromIsbn('123456789012')).toBe('ISBN must be 10 or 13 characters long');
  })


  it('should return error if the isbn contains letters', async () => {
    expect(await generateReport.classifierFromIsbn('123456789012a')).toBe('ISBN 13 must contain only numbers, ISBN 10 can contain numbers and X');
  })

  it('should return error if the isbn is not found in open library', async () => {
    expect(await generateReport.classifierFromIsbn('0000000000')).toBe('ISBN not found in Open Library');
  })


})

describe('testing mmsidFromClassifier' , () =>{

  it('should return null if the classifier is not found in the alma catalog', async () => {
    expect(await generateReport.mmsidFromClassifier('ZZ999')).toBe(null);
  })

  it('should return an array of mmsids if the classifier is found in the alma catalog', async () => {
    const classifier = 'BS195';
    const result = await generateReport.mmsidFromClassifier(classifier);
    expect(result).toEqual([
      '992150263402909',
      '9910041373302909',
      '992913493402909',
      '99977523402909',
      '991566853402909',
      '99738073402909',
      '992033773402909'
    ]);
  })

})

describe('testing getLoanCount' , () => {
  it('should return null if the mmsid array is empty', async () => {
    expect(await generateReport.getLoanCount([])).toBe('mmsid Array is empty or null');
  })

  it('should return an array of objects with mmsid and loanCount properties', async () => {
    const mmsidArray = ['992150263402909', '9910041373302909'];
    const result = await generateReport.getLoanCount(mmsidArray);
    expect(result).toEqual([
      { mmsid: '992150263402909', loanCount: 0 },
      { mmsid: '9910041373302909', loanCount: 3 }
    ]);
  })

})

describe('testing getLeastUsed' , () => {
  it('should return up to 5 least used mmsids from the loanCounts array', async () => {
    const loanCounts = [
    { mmsid: '992150263402909', loanCount: 0 },
    { mmsid: '9910041373302909', loanCount: 3 },
    { mmsid: '992913493402909', loanCount: 0 },
    { mmsid: '99977523402909', loanCount: 13 },
    { mmsid: '991566853402909', loanCount: 1 },
    { mmsid: '99738073402909', loanCount: 0 },
    { mmsid: '992033773402909', loanCount: 1 }
];

    const result = await generateReport.getLeastUsed(loanCounts);
    expect(result).toEqual([
      { mmsid: '992150263402909', loanCount: 0 },
      { mmsid: '992913493402909', loanCount: 0 },
      { mmsid: '99738073402909', loanCount: 0 },
      { mmsid: '991566853402909', loanCount: 1 },
      { mmsid: '992033773402909', loanCount: 1 }
    ]);

  })

  it('should return less than 5 least used mmsids if the loanCounts array has less than 5 elements', async () => {
    const loanCounts = [
      { mmsid: '99123456789012345', loanCount: 5 },
      { mmsid: '99123456789012346', loanCount: 3 },
      { mmsid: '99123456789012347', loanCount: 8 }
    ];
    
    const result = await generateReport.getLeastUsed(loanCounts);
    expect(result).toEqual([
      { mmsid: '99123456789012346', loanCount: 3 },
      { mmsid: '99123456789012345', loanCount: 5 },
      { mmsid: '99123456789012347', loanCount: 8 }
    ]);
  })

  it('should return null if the loanCounts array is empty', async () => {
    const loanCounts = [];
    const result = await generateReport.getLeastUsed(loanCounts);
    expect(result).toBe(null);
  })
  
  it('should return null if the loanCounts is null', async () => {
    const loanCounts = null;
    const result = await generateReport.getLeastUsed(loanCounts);
    expect(result).toBe("Loan input must be an array");
  })
  
  it('should return loan input must be array if loanCounts is not an array', async () => {
    const loanCounts = 'mmsid: 992150263402909, loanCount: 0';
    const result = await generateReport.getLeastUsed(loanCounts);
    expect(result).toBe('Loan input must be an array');
  })


})

describe('testing generateReport' , () => {
  it('should return an array of up to 5 least used mmsids for a valid isbn', async () => {
    const isbn = '9781433502415';
    const result = await generateReport.generateReport(isbn);
    expect(result).toEqual([
      { mmsid: '992150263402909', loanCount: 0 },
      { mmsid: '992913493402909', loanCount: 0 },
      { mmsid: '99738073402909', loanCount: 0 },
      { mmsid: '991566853402909', loanCount: 1 },
      { mmsid: '992033773402909', loanCount: 1 }
    ]);
  })
  
})
