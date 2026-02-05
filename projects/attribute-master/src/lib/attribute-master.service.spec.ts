import { TestBed } from '@angular/core/testing';

import { AttributeMasterService } from './attribute-master.service';

describe('AttributeMasterService', () => {
  let service: AttributeMasterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AttributeMasterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
