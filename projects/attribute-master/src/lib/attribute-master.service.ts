import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { ConfigService } from './config.service';

export interface AttributeMaster {
  AttributeType: string;
  ApplyTo: string;
  IsMappingRequired: boolean;
  MappedBy: string;
  AttributeDetails: AttributeDetails[];
}

export interface AttributeDetails {
  ID?: number;
  FieldName: string;
  DataType: string;
  OrderNo: string;
  Regex: string;
  HasParent: boolean;
  ParentField: string;
  CheckUniqueConstraint: boolean;
  ConstraintMode: string;
  IsRequired: number;
  UseAsBarcode: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AttributeMasterService {
  attributeMasterObj: AttributeMaster = {
    AttributeType: '',
    ApplyTo: '',
    IsMappingRequired: false,
    MappedBy: '',
    AttributeDetails: [],
  };

  private tableDataSubject = new BehaviorSubject<AttributeDetails[]>([]);
  tableData$ = this.tableDataSubject.asObservable();

  public editDataSubject = new Subject<AttributeDetails>();
  editData$ = this.editDataSubject.asObservable();
  private resetFormSubject = new Subject<void>();
  resetForm$ = this.resetFormSubject.asObservable();

  constructor(
    private http: HttpClient,
    private configService: ConfigService,
  ) {}

  private get apiUrl(): string {
    return this.configService.getApiUrl();
  }

  private syncTable() {
    this.tableDataSubject.next([...this.attributeMasterObj.AttributeDetails]);
  }

  // addAttribute(detail: AttributeDetails) {
  //   const exists = this.attributeMasterObj.AttributeDetails.some(
  //     (d) => d.OrderNo === detail.OrderNo,
  //   );
  //   if (exists) throw new Error('Order No must be unique');

  //   detail.ID = this.attributeMasterObj.AttributeDetails.length + 1;
  //   this.attributeMasterObj.AttributeDetails.push(detail);
  //   this.syncTable();
  // }

  updateAttribute(detail: AttributeDetails) {
    const index = this.attributeMasterObj.AttributeDetails.findIndex((d) => d.ID === detail.ID,);
    if (index === -1) {
      throw new Error('Attribute not found');
    }
    this.attributeMasterObj.AttributeDetails[index] = detail;
    this.syncTable();
  }

  deleteAttribute(id: number) {
    this.http
      .post(`${this.apiUrl}/deleteAttributeDetail?ID=${id}`, {})
      .subscribe((res: any) => {
        if(res.status == 'ok'){
          this.attributeMasterObj.AttributeDetails = this.attributeMasterObj.AttributeDetails.filter((d) => d.ID !== id,).map((d, i) => ({ ...d, sn: i + 1 }));
          this.syncTable();          
        }
      });
  }

  resetForm() {
    this.resetFormSubject.next();
  }

  getAttributeTypes() {
    return this.http.get(`${this.apiUrl}/getAttributeTypeList`);
  }

  getApplyToList(attributeTypeID: string) {
    return this.http.get(`${this.apiUrl}/getApplyToList?attributeType=${attributeTypeID}`);
  }

  getParentAttributes() {
    return this.http.get(`${this.apiUrl}/getParentAttributes`);
  }

  getMappedBy() {
    return this.http.get(`${this.apiUrl}/getMappedByList`);
  }

  getAttributeDetails(attributeType: string, applyTo: string) {
    return this.http.get<any>(`${this.apiUrl}/getAttributeDetails?attributeType=${attributeType}&applyTo=${applyTo}`);
  }

  loadMaster(attributeType: string, applyTo: string) {
    return this.getAttributeDetails(attributeType, applyTo).subscribe((res) => {
      if (res.status === 'ok') {
        this.attributeMasterObj = {
          AttributeType: attributeType,
          ApplyTo: applyTo,
          IsMappingRequired: res.result.IsMappingRequired,
          MappedBy: res.result.MappedBy,
          AttributeDetails: res.result.AttributeDetails || [],
        };
        this.syncTable();
      }
    });
  }

  saveMaster() {
    if (!this.attributeMasterObj.AttributeDetails.length) {
      throw new Error('No attributes to save');
    }
    const body = { data: this.attributeMasterObj };
    return this.http.post(`${this.apiUrl}/SaveAttributeMaster`, body);
  }

  // saveAllAttributes() {
  //   const master = this.attributeMasterObj;

  //   if (!master.AttributeDetails || master.AttributeDetails.length === 0) {
  //     throw new Error('No attribute data to save');
  //   }

  //   master.AttributeDetails = master.AttributeDetails.map((row) => ({
  //     ...row,
  //     AttributeType: master.AttributeType,
  //     ApplyTo: master.ApplyTo,
  //     IsMappingRequired: master.IsMappingRequired,
  //     MappedBy: master.MappedBy,
  //   }));

  //   return this.http.post(`${this.apiUrl}/SaveAttributeMaster`, master);
  // }

  addOrUpdateRow(row: any, isEdit = false, sn?: number) {
    this.attributeMasterObj.AttributeType = row.AttributeType;
    this.attributeMasterObj.ApplyTo = row.ApplyTo;
    this.attributeMasterObj.IsMappingRequired = row.IsMappingRequired;
    this.attributeMasterObj.MappedBy = row.MappedBy;

    if (!this.attributeMasterObj.AttributeDetails) {
      this.attributeMasterObj.AttributeDetails = [];
    }

    if (isEdit) {
      const index = this.attributeMasterObj.AttributeDetails.findIndex((r) => r.ID === sn);
      if (index !== -1) {
        this.attributeMasterObj.AttributeDetails[index] = { ...row, ID: sn };
      } else {
        throw new Error('Row not found for update');
      }
    } else {
      row.sn = this.attributeMasterObj.AttributeDetails.length + 1;
      this.attributeMasterObj.AttributeDetails.push(row);
    }
    this.tableDataSubject.next([...this.attributeMasterObj.AttributeDetails]);
  }

  clearTable() {
    this.attributeMasterObj.AttributeDetails = [];
    this.tableDataSubject.next([]);
  }
}
