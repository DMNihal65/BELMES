ws://172.18.7.88:5458/production_monitoring/ws/live-status/ : ~~~

`[{"machine_id":1,"machine_name":"Unknown-1","status":"OFF","program_number":"","active_program":"","selected_program":"","part_count":0,"job_status":null,"last_updated":"2025-05-14T16:42:00.905224","job_in_progress":null,"production_order":null,"part_number":null,"part_description":null,"required_quantity":null,"launched_quantity":null,"operation_number":null,"operation_description":null},{"machine_id":2,"machine_name":"Unknown-2","status":"PRODUCTION","program_number":"TNC:\\MWT\\POLEPCASSY\\3.5 thick POLE PIECE ASSEMBLY.H","active_program":"TNC:\\MWT\\POLEPCASSY\\3.5 thick POLE PIECE ASSEMBLY.H","selected_program":"TNC:\\MWT\\POLEPCASSY\\3.5 thick POLE PIECE ASSEMBLY.H","part_count":0,"job_status":null,"last_updated":"2025-05-14T16:42:00.917034","job_in_progress":null,"production_order":null,"part_number":null,"part_description":null,"required_quantity":null,"launched_quantity":null,"operation_number":null,"operation_description":null}`]

~~~

http://172.18.7.88:5458/api/v1/operator/machines/17/operations : 
~~~

{
"machine": {
"id": 17,
"type": "Default",
"make": "DMU 60eVo Linear",
"model": "Default",
"cnc_controller": "Default Controller",
"work_center": {
"id": 3,
"code": "CNCM",
"name": "MILLING - STUD"
}
},
"operations": {
"completed": [],
"inprogress": [
{
"operation_id": 165,
"operation_number": 40,
"description": "MILLING - TOP ROUGH",
"order_id": 21,
"production_order": "10557513",
"part_number": "213511100114",
"part_description": "SK",
"schedule_info": {
"planned_start_time": "2025-05-17T10:23:18.889481",
"planned_end_time": "2025-05-20T11:53:18.889481"
}
}
],
"scheduled": [
{
"operation_id": 166,
"operation_number": 50,
"description": "MILLING - BOTTOM ROUGH",
"order_id": 21,
"production_order": "10557513",
"part_number": "213511100114",
"part_description": "SK",
"schedule_info": {
"planned_start_time": "2025-05-20T11:53:18.889481",
"planned_end_time": "2025-05-23T12:53:18.889481"
}
},
{
"operation_id": 167,
"operation_number": 60,
"description": "Top Clean",
"order_id": 21,
"production_order": "10557513",
"part_number": "213511100114",
"part_description": "SK",
"schedule_info": {
"planned_start_time": "2025-05-23T12:53:18.889481",
"planned_end_time": "2025-05-24T12:35:18.889481"
}
},
{
"operation_id": 168,
"operation_number": 70,
"description": "MILLING - TOP FINISH",
"order_id": 21,
"production_order": "10557513",
"part_number": "213511100114",
"part_description": "SK",
"schedule_info": {
"planned_start_time": "2025-05-24T12:35:18.889481",
"planned_end_time": "2025-06-08T13:35:18.889481"
}
},
{
"operation_id": 169,
"operation_number": 80,
"description": "MILLING - BOTTOM FINISH",
"order_id": 21,
"production_order": "10557513",
"part_number": "213511100114",
"part_description": "SK",
"schedule_info": {
"planned_start_time": "2025-06-08T13:35:18.889481",
"planned_end_time": "2025-06-23T14:35:18.889481"
}
},
{
"operation_id": 170,
"operation_number": 90,
"description": "MILLING - SIDE FINISH",
"order_id": 21,
"production_order": "10557513",
"part_number": "213511100114",
"part_description": "SK",
"schedule_info": {
"planned_start_time": "2025-06-23T14:35:18.889481",
"planned_end_time": "2026-01-21T11:41:20.417587"
}
},
{
"operation_id": 164,
"operation_number": 30,
"description": "MILLING - STUD",
"order_id": 21,
"production_order": "10557513",
"part_number": "213511100114",
"part_description": "SK",
"schedule_info": {
"planned_start_time": "2026-01-21T11:41:20.417587",
"planned_end_time": "2026-03-15T17:00:00"
}
}
]
},
"orders": [
{
"order_id": 21,
"priority": 1,
"part_number": "213511100114",
"production_order": "10557513",
"material_description": "SK",
"required_qty": 24,
"launched_qty": 24,
"sales_order": "07/3111202373/0110",
"wbs_element": "Sale order :07/3111202373/0110 Part Desc :SKTI CHASSIS [Tot.No](http://tot.no/) of Oprns :12",
"full_description": "Sale order :07/3111202373/0110 Part Desc :SK [Tot.No](http://tot.no/) of Oprns :19",
"project_details": {
"total_operations": 19,
"project_name": "BMPM C-Ku 100 W"
},
"has_inprogress": true
}
],
"totals": {
"completed": 0,
"inprogress": 1,
"scheduled": 6
}
}

~~~

Search the Operations and Order Details 

http://172.18.7.88:5458/api/v1/planning/search_order?part_number=213511100114 : 
~~~

{
"orders": [
{
"id": 21,
"production_order": "10557513",
"sale_order": "07/3111202373/0110",
"wbs_element": "Sale order :07/3111202373/0110 Part Desc :SKTI CHASSIS [Tot.No](http://tot.no/) of Oprns :12",
"part_number": "213511100114",
"part_description": "SK",
"total_operations": 19,
"required_quantity": 24,
"launched_quantity": 24,
"plant_id": "1154",
"project": {
"id": 21,
"name": "BMPM C-Ku 100 W",
"priority": 1,
"start_date": "2025-05-13T09:19:26.834274",
"end_date": "2025-05-13T09:19:26.834274"
},
"operations": [
{
"id": 166,
"operation_number": 50,
"operation_description": "MILLING - BOTTOM ROUGH",
"setup_time": 1.0,
"ideal_cycle_time": 1.0,
"work_center": "CNCM"
},
{
"id": 164,
"operation_number": 30,
"operation_description": "MILLING - STUD",
"setup_time": 1.0,
"ideal_cycle_time": 0.5,
"work_center": "CNCM"
},
{
"id": 221,
"operation_number": 140,
"operation_description": "speeding",
"setup_time": 0.27,
"ideal_cycle_time": 0.04,
"work_center": "SMPD"
},
{
"id": 167,
"operation_number": 60,
"operation_description": "Top Clean",
"setup_time": 0.5,
"ideal_cycle_time": 0.3,
"work_center": "CNCM"
},
{
"id": 222,
"operation_number": 150,
"operation_description": "speeding",
"setup_time": 0.27,
"ideal_cycle_time": 0.04,
"work_center": "SMPD"
},
{
"id": 220,
"operation_number": 130,
"operation_description": "speeding",
"setup_time": 0.27,
"ideal_cycle_time": 0.04,
"work_center": "SMPD"
},
{
"id": 223,
"operation_number": 160,
"operation_description": "speeding",
"setup_time": 0.27,
"ideal_cycle_time": 0.04,
"work_center": "SMPD"
},
{
"id": 224,
"operation_number": 170,
"operation_description": "speeding",
"setup_time": 0.27,
"ideal_cycle_time": 0.04,
"work_center": "SMPD"
},
{
"id": 162,
"operation_number": 10,
"operation_description": "finding details",
"setup_time": 0.21,
"ideal_cycle_time": 0.21,
"work_center": "FAB-C-PC"
},
{
"id": 225,
"operation_number": 180,
"operation_description": "milling",
"setup_time": 0.09,
"ideal_cycle_time": 0.04,
"work_center": "SPH1"
},
{
"id": 165,
"operation_number": 40,
"operation_description": "MILLING - TOP ROUGH",
"setup_time": 1.5,
"ideal_cycle_time": 1.0,
"work_center": "CNCM"
},
{
"id": 171,
"operation_number": 100,
"operation_description": "Deburr",
"setup_time": 0.1,
"ideal_cycle_time": 0.5,
"work_center": "SMPD"
},
{
"id": 172,
"operation_number": 110,
"operation_description": "Inspection  before Plating",
"setup_time": 2.0,
"ideal_cycle_time": 1.5,
"work_center": "QFAB"
},
{
"id": 163,
"operation_number": 20,
"operation_description": "CUTTING",
"setup_time": 0.2,
"ideal_cycle_time": 0.5,
"work_center": "MMC1"
},
{
"id": 168,
"operation_number": 70,
"operation_description": "MILLING - TOP FINISH",
"setup_time": 1.0,
"ideal_cycle_time": 5.0,
"work_center": "CNCM"
},
{
"id": 173,
"operation_number": 120,
"operation_description": "FINAL VERIFICATION",
"setup_time": 0.5,
"ideal_cycle_time": 0.5,
"work_center": "QFAB"
},
{
"id": 226,
"operation_number": 190,
"operation_description": "speeding",
"setup_time": 0.06,
"ideal_cycle_time": 0.02,
"work_center": "QFAB"
},
{
"id": 170,
"operation_number": 90,
"operation_description": "MILLING - SIDE FINISH",
"setup_time": 1.5,
"ideal_cycle_time": 5.0,
"work_center": "CNCM"
},
{
"id": 169,
"operation_number": 80,
"operation_description": "MILLING - BOTTOM FINISH",
"setup_time": 1.0,
"ideal_cycle_time": 5.0,
"work_center": "CNCM"
}
]
}
]
}

~~~

Details/ MPP 

http://172.18.7.88:5458/api/v1/document-management/documents/by-part-number-all/213511100114 :
~~~

{
"part_number": "213511100114",
"mpp_document": {
"id": 71,
"name": "rr",
"folder_id": 3,
"doc_type_id": 1,
"description": "rr",
"part_number": "213511100114",
"production_order_id": null,
"created_at": "2025-05-14T05:58:37.938977",
"created_by_id": 4,
"is_active": true,
"latest_version": {
"id": 85,
"document_id": 71,
"version_number": "1.0",
"minio_path": "documents/v2/Document Types/MPP/213511100114/71/v1.0/Annexure G - Manufacturing Process plan.pdf",
"file_size": 1018366,
"checksum": "36537b155e6153e22ead8118252c60ecd98c50038c49bde404636ca1d955435d",
"created_at": "2025-05-14T05:58:37.977061",
"created_by_id": 4,
"is_active": true,
"metadata": {}
}
},
"oarc_document": null,
"engineering_drawing_document": {
"id": 72,
"name": "rr",
"folder_id": 5,
"doc_type_id": 2,
"description": "rr",
"part_number": "213511100114",
"production_order_id": null,
"created_at": "2025-05-14T05:58:38.071789",
"created_by_id": 4,
"is_active": true,
"latest_version": null
},
"ipid_document": null,
"all_documents": [
{
"id": 62,
"name": "route - Copy",
"folder_id": 68,
"doc_type_id": 3,
"description": "route - Copy",
"part_number": "213511100114",
"production_order_id": null,
"created_at": "2025-05-14T04:54:10.173454",
"created_by_id": 4,
"is_active": true,
"latest_version": {
"id": 73,
"document_id": 62,
"version_number": "1",
"minio_path": "documents/cnc_programs/213511100114/op100/62/v1/route - Copy.txt",
"file_size": 3310,
"checksum": "dd204fd6b100c5529b24f1896ec7d9892033921431c5049d06cde12416ad7340",
"created_at": "2025-05-14T04:54:10.217272",
"created_by_id": 4,
"is_active": true,
"metadata": {
"part_number": "213511100114",
"program_path": "route - Copy.txt",
"operation_number": "100"
}
}
},
{
"id": 22,
"name": "route",
"folder_id": 23,
"doc_type_id": 3,
"description": "route",
"part_number": "213511100114",
"production_order_id": null,
"created_at": "2025-05-12T09:07:57.109958",
"created_by_id": 4,
"is_active": true,
"latest_version": {
"id": 26,
"document_id": 22,
"version_number": "1",
"minio_path": "documents/cnc_programs/213511100114/op140/22/v1/route.txt",
"file_size": 3310,
"checksum": "dd204fd6b100c5529b24f1896ec7d9892033921431c5049d06cde12416ad7340",
"created_at": "2025-05-12T09:07:57.162713",
"created_by_id": 4,
"is_active": true,
"metadata": {
"part_number": "213511100114",
"program_path": "route.txt",
"operation_number": "140"
}
}
},
{
"id": 21,
"name": "route - Copy (2)",
"folder_id": 23,
"doc_type_id": 3,
"description": "route - Copy (2)",
"part_number": "213511100114",
"production_order_id": null,
"created_at": "2025-05-12T08:58:50.331350",
"created_by_id": 4,
"is_active": true,
"latest_version": {
"id": 25,
"document_id": 21,
"version_number": "1",
"minio_path": "documents/cnc_programs/213511100114/op140/21/v1/route - Copy (2).txt",
"file_size": 3310,
"checksum": "dd204fd6b100c5529b24f1896ec7d9892033921431c5049d06cde12416ad7340",
"created_at": "2025-05-12T08:58:50.365022",
"created_by_id": 4,
"is_active": true,
"metadata": {
"part_number": "213511100114",
"program_path": "route - Copy (2).txt",
"operation_number": "140"
}
}
},
{
"id": 20,
"name": "route",
"folder_id": 23,
"doc_type_id": 3,
"description": "route",
"part_number": "213511100114",
"production_order_id": null,
"created_at": "2025-05-12T08:57:00.189149",
"created_by_id": 4,
"is_active": true,
"latest_version": {
"id": 24,
"document_id": 20,
"version_number": "1",
"minio_path": "documents/cnc_programs/213511100114/op140/20/v1/route.txt",
"file_size": 3310,
"checksum": "dd204fd6b100c5529b24f1896ec7d9892033921431c5049d06cde12416ad7340",
"created_at": "2025-05-12T08:57:00.198444",
"created_by_id": 4,
"is_active": true,
"metadata": {
"part_number": "213511100114",
"program_path": "route.txt",
"operation_number": "140"
}
}
},
{
"id": 17,
"name": "route",
"folder_id": 18,
"doc_type_id": 3,
"description": "route",
"part_number": "213511100114",
"production_order_id": null,
"created_at": "2025-05-12T08:54:21.034589",
"created_by_id": 4,
"is_active": true,
"latest_version": {
"id": 21,
"document_id": 17,
"version_number": "1",
"minio_path": "documents/cnc_programs/213511100114/op120/17/v1/route.txt",
"file_size": 3310,
"checksum": "dd204fd6b100c5529b24f1896ec7d9892033921431c5049d06cde12416ad7340",
"created_at": "2025-05-12T08:54:21.060132",
"created_by_id": 4,
"is_active": true,
"metadata": {
"part_number": "213511100114",
"program_path": "route.txt",
"operation_number": "120"
}
}
},
{
"id": 16,
"name": "route",
"folder_id": 19,
"doc_type_id": 3,
"description": "route",
"part_number": "213511100114",
"production_order_id": null,
"created_at": "2025-05-12T08:47:05.411306",
"created_by_id": 4,
"is_active": true,
"latest_version": {
"id": 20,
"document_id": 16,
"version_number": "1",
"minio_path": "documents/cnc_programs/213511100114/op20/16/v1/route.txt",
"file_size": 3310,
"checksum": "dd204fd6b100c5529b24f1896ec7d9892033921431c5049d06cde12416ad7340",
"created_at": "2025-05-12T08:47:05.440037",
"created_by_id": 4,
"is_active": true,
"metadata": {
"part_number": "213511100114",
"program_path": "route.txt",
"operation_number": "20"
}
}
},
{
"id": 15,
"name": "route",
"folder_id": 19,
"doc_type_id": 3,
"description": "route",
"part_number": "213511100114",
"production_order_id": null,
"created_at": "2025-05-12T08:43:41.166077",
"created_by_id": 4,
"is_active": true,
"latest_version": {
"id": 19,
"document_id": 15,
"version_number": "1",
"minio_path": "documents/cnc_programs/213511100114/op20/15/v1/route.txt",
"file_size": 3310,
"checksum": "dd204fd6b100c5529b24f1896ec7d9892033921431c5049d06cde12416ad7340",
"created_at": "2025-05-12T08:43:41.181928",
"created_by_id": 4,
"is_active": true,
"metadata": {
"part_number": "213511100114",
"program_path": "route.txt",
"operation_number": "20"
}
}
},
{
"id": 14,
"name": "route - Copy",
"folder_id": 18,
"doc_type_id": 3,
"description": "route - Copy",
"part_number": "213511100114",
"production_order_id": null,
"created_at": "2025-05-12T08:41:13.229171",
"created_by_id": 4,
"is_active": true,
"latest_version": {
"id": 18,
"document_id": 14,
"version_number": "1",
"minio_path": "documents/cnc_programs/213511100114/op120/14/v1/route - Copy.txt",
"file_size": 3310,
"checksum": "dd204fd6b100c5529b24f1896ec7d9892033921431c5049d06cde12416ad7340",
"created_at": "2025-05-12T08:41:13.262946",
"created_by_id": 4,
"is_active": true,
"metadata": {
"part_number": "213511100114",
"program_path": "route - Copy.txt",
"operation_number": "120"
}
}
},
{
"id": 5,
"name": "route",
"folder_id": 9,
"doc_type_id": 3,
"description": "route",
"part_number": "213511100114",
"production_order_id": null,
"created_at": "2025-05-12T06:37:35.174798",
"created_by_id": 4,
"is_active": true,
"latest_version": {
"id": 10,
"document_id": 5,
"version_number": "3",
"minio_path": "documents/cnc_programs/213511100114/op10/5/v3/route - Copy (2).txt",
"file_size": 3310,
"checksum": "dd204fd6b100c5529b24f1896ec7d9892033921431c5049d06cde12416ad7340",
"created_at": "2025-05-12T07:12:47.185374",
"created_by_id": 4,
"is_active": true,
"metadata": {
"part_number": "213511100114",
"program_path": "route - Copy (2).txt",
"operation_number": "10"
}
}
},
{
"id": 4,
"name": "route - Copy (2)",
"folder_id": 8,
"doc_type_id": 3,
"description": "route - Copy (2)",
"part_number": "213511100114",
"production_order_id": null,
"created_at": "2025-05-12T06:37:35.162238",
"created_by_id": 4,
"is_active": true,
"latest_version": {
"id": 4,
"document_id": 4,
"version_number": "1",
"minio_path": "documents/cnc_programs/213511100114/op50/4/v1/route - Copy (2).txt",
"file_size": 3310,
"checksum": "dd204fd6b100c5529b24f1896ec7d9892033921431c5049d06cde12416ad7340",
"created_at": "2025-05-12T06:37:35.170238",
"created_by_id": 4,
"is_active": true,
"metadata": {
"part_number": "213511100114",
"program_path": "route - Copy (2).txt",
"operation_number": "50"
}
}
},
{
"id": 3,
"name": "route - Copy",
"folder_id": 8,
"doc_type_id": 3,
"description": "route - Copy",
"part_number": "213511100114",
"production_order_id": null,
"created_at": "2025-05-12T06:37:35.109371",
"created_by_id": 4,
"is_active": true,
"latest_version": {
"id": 3,
"document_id": 3,
"version_number": "1",
"minio_path": "documents/cnc_programs/213511100114/op50/3/v1/route - Copy.txt",
"file_size": 3310,
"checksum": "dd204fd6b100c5529b24f1896ec7d9892033921431c5049d06cde12416ad7340",
"created_at": "2025-05-12T06:37:35.149397",
"created_by_id": 4,
"is_active": true,
"metadata": {
"part_number": "213511100114",
"program_path": "route - Copy.txt",
"operation_number": "50"
}
}
},
{
"id": 72,
"name": "rr",
"folder_id": 5,
"doc_type_id": 2,
"description": "rr",
"part_number": "213511100114",
"production_order_id": null,
"created_at": "2025-05-14T05:58:38.071789",
"created_by_id": 4,
"is_active": true,
"latest_version": null
},
{
"id": 71,
"name": "rr",
"folder_id": 3,
"doc_type_id": 1,
"description": "rr",
"part_number": "213511100114",
"production_order_id": null,
"created_at": "2025-05-14T05:58:37.938977",
"created_by_id": 4,
"is_active": true,
"latest_version": {
"id": 85,
"document_id": 71,
"version_number": "1.0",
"minio_path": "documents/v2/Document Types/MPP/213511100114/71/v1.0/Annexure G - Manufacturing Process plan.pdf",
"file_size": 1018366,
"checksum": "36537b155e6153e22ead8118252c60ecd98c50038c49bde404636ca1d955435d",
"created_at": "2025-05-14T05:58:37.977061",
"created_by_id": 4,
"is_active": true,
"metadata": {}
}
}
]
}

~~~

if the data is Present in the MPP - (mpp_document) then use the id = 71 and go to the endpoint to view or downlaod the mpp using the endpoint : “”’http://172.18.7.88:5458/api/v1/document-management/documents/71/download-latest”””

or else if the mpp_document is empty in the response then go to the endpoint : “”http://172.18.7.88:5458/api/v1/mpp/by-part/213301910108/40””” where the partnumber and 40 is the operation for each the instructions are there show that using the the response : “”’

```
[
  {
    "id": 3,
    "order_id": 4,
    "operation_id": 38,
    "document_id": null,
    "fixture_number": "asdasdasd",
    "ipid_number": "asdasdasdasd",
    "datum_x": "asdasdas",
    "datum_y": "dasdasd",
    "datum_z": "asdasdasdasd",
    "work_instructions": {
      "sections": [
        {
          "title": "Fixture Setup",
          "sequence": 0,
          "instructions": "\u003Cp\u003Easdasdasd\u003C/p\u003E"
        },
        {
          "title": "Job Preparation",
          "sequence": 1,
          "instructions": "\u003Cp\u003Easdasdasd\u003C/p\u003E"
        },
        {
          "title": "Post-Machining Steps",
          "sequence": 2,
          "instructions": "\u003Cp\u003Easdasdasd\u003C/p\u003E"
        },
        {
          "title": "New Section 4",
          "sequence": 3,
          "instructions": "\u003Cp\u003Easdasdasd\u003C/p\u003E"
        },
        {
          "title": "New Section 5",
          "sequence": 4,
          "instructions": "\u003Cp\u003Easdasdasd\u003C/p\u003E"
        }
      ]
    },
    "part_number": "213301910108",
    "operation_number": 40
  }
]
```

for the section of the documents : “”’http://172.18.7.88:5458/api/v1/document-management/documents/by-part-number-all/213301910108””” use the same endpoint that returns : “”

{
"part_number": "213301910108",
"mpp_document": null,
"oarc_document": null,
"engineering_drawing_document": null,
"ipid_document": null,
"all_documents": []
}

‘’’ show the : “”engineering_drawing_document”” and “"mpp_document”” and when clciked should view or download using the id and using the endpoint : “”http://172.18.7.88:5458/api/v1/document-management/documents/download-latest/213511100114/MPP”” and “””http://172.18.7.88:5458/api/v1/document-management/documents/download-latest/213511100114/ENGINEERING_DRAWING””

There are 3 options to select the job the operator wants to work on - InProgress,Scheduled,CustomJob . the Whole Dashbaord depends on the job/operation selected and the data will change according to what the user has selected and will also be presistant and will not change when refreshed.

let me expalin how does this work : so the there will be sections one is the Machine Status Section this is independent and doesnt depend on any selection just get the machine id from the local storeage and use the same to connect to the websocket endpoint and display the details / status comming from the websocket.

So comming to the first type of job selection : InProgress for this use the endpoint : “””http://172.18.7.88:5458/api/v1/operator/machines/17/operations “” where is shows the inProgress job and show the same and let the user select the job and according to the selected job the sections like the current Job , Operation Seqence , document changes and get the data for the same partnumber. using the assinged endpoints for there sections using the data from the selected job : “”"operation_id": 165,
"operation_number": 40,
"description": "MILLING - TOP ROUGH",
"order_id": 21,
"production_order": "10557513",
"part_number": "213511100114",
"part_description": "SK",
"schedule_info": {
"planned_start_time": "2025-05-17T10:23:18.889481",
"planned_end_time": "2025-05-20T11:53:18.889481"”””

Next type of section is the Scheduled Job : that is also using the same ednpoint : “”“””http://172.18.7.88:5458/api/v1/operator/machines/17/operations “”””” scheduled_job and the user can select from the available jobs and after the user has selected any job the data should be populated and get the data according to the selection and shown.

Next is the Most improtant type of the selection that is the selction of the custom jobs : for this we need to go the endpoint : “”http://172.18.7.88:5458/api/v1/planning/all_orders””” which has the resposne format as : “”

[
{
"id": 1,
"production_order": "10557513",
"sale_order": "07/3111202373/0110",
"wbs_element": "Sale order :07/3111202373/0110 Part Desc :SKTI CHASSIS [Tot.No](http://tot.no/) of Oprns :12",
"part_number": "213511100114",
"part_description": "SK",
"total_operations": 13,
"required_quantity": 24,
"launched_quantity": 24,
"plant_id": "1154",
"project": {
"id": 1,
"name": "BMPM C-Ku 100 W",
"priority": 1,
"delivery_date": "2025-05-15T11:55:49.638704"
}
},
{
"id": 4,
"production_order": "10574794",
"sale_order": "07//0000",
"wbs_element": "COAD-2370-03-ISA",
"part_number": "213301910108",
"part_description": "IS&A-1 SOLENOID BOBBIN",
"total_operations": 9,
"required_quantity": 311,
"launched_quantity": 311,
"plant_id": "1154",
"project": {
"id": 4,
"name": "TXT-COMPONENTS FOR BDL",
"priority": 2,
"delivery_date": "2025-05-19T16:06:50.178349"
}
},
{
"id": 5,
"production_order": "12345678",
"sale_order": "12",
"wbs_element": "we",
"part_number": "1234",
"part_description": "part",
"total_operations": 1,
"required_quantity": 1,
"launched_quantity": 0,
"plant_id": "12",
"project": {
"id": 5,
"name": "tool_test",
"priority": 3,
"delivery_date": "2025-05-19T16:07:38.498707"
}
}
]

~~~~

and from this above resposne use the Production Order | Partnumber as the drop down to user to select and then when the user selects any on of the order, next he needs to select the opeartion he will work to update the currentjob section and also get all the operations and other details regreding the job to update the operation seqence , current job, documents sections for that use the endpoint : “””http://172.18.7.88:5458/api/v1/planning/search_order?part_number=213301910108””” and the format will be : “”’

{
"orders": [
{
"id": 4,
"production_order": "10574794",
"sale_order": "07//0000",
"wbs_element": "COAD-2370-03-ISA",
"part_number": "213301910108",
"part_description": "IS&A-1 SOLENOID BOBBIN",
"total_operations": 9,
"required_quantity": 311,
"launched_quantity": 311,
"plant_id": "1154",
"project": {
"id": 4,
"name": "TXT-COMPONENTS FOR BDL",
"priority": 2,
"start_date": "2025-05-19T16:06:50.178349",
"end_date": "2025-05-19T16:06:50.178349"
},
"operations": [
{
"id": 39,
"operation_number": 50,
"operation_description": "CNC TURNING 4TH OPERATION",
"setup_time": 7.5,
"ideal_cycle_time": 0.57,
"work_center": "CNCT"
},
{
"id": 35,
"operation_number": 10,
"operation_description": "Raw Material Cutting ø25 x 500",
"setup_time": 0.1,
"ideal_cycle_time": 0.02,
"work_center": "MMC1"
},
{
"id": 38,
"operation_number": 40,
"operation_description": "CNC TURNING 3ROPERATION",
"setup_time": 4.0,
"ideal_cycle_time": 0.33,
"work_center": "CNCT"
},
{
"id": 37,
"operation_number": 30,
"operation_description": "CNC TURNING 2ND OPERATION",
"setup_time": 15.0,
"ideal_cycle_time": 1.1,
"work_center": "CNCT"
},
{
"id": 40,
"operation_number": 60,
"operation_description": "CNC MILLING",
"setup_time": 4.0,
"ideal_cycle_time": 0.13,
"work_center": "CNCM"
},
{
"id": 43,
"operation_number": 90,
"operation_description": "Post plating inspection",
"setup_time": 0.5,
"ideal_cycle_time": 0.2,
"work_center": "QFAB"
},
{
"id": 41,
"operation_number": 70,
"operation_description": "DEBURRING",
"setup_time": 0.0,
"ideal_cycle_time": 0.0,
"work_center": "SMFD"
},
{
"id": 42,
"operation_number": 80,
"operation_description": "Pre-plating inspection",
"setup_time": 0.5,
"ideal_cycle_time": 0.2,
"work_center": "QFAB"
},
{
"id": 36,
"operation_number": 20,
"operation_description": "CNC TURNING 1ST OPERATION",
"setup_time": 45.0,
"ideal_cycle_time": 1.2,
"work_center": "CNCT"
}
]
}
]
}

“”””

the major catch is that if the user has selected any order using the options for inprogress job he no need to activate the job. but needs to activate the job using the endpoint : “”

**`http://172.18.7.88:5458/api/v1/logs/machine-raw-live/`"””  the format needs to be sent to activate is : “”’**

{
"machine_id": 0,
"operation_id": 0
}

“””
where machine_id should be get by the local storage and the operation id from the selected job and activate the job. for both the scheculded and custom job selection.

if the user want to select other job in the scheduled or custom job he needs to deactivate the current job using the endpoint : “””

**`http://172.18.7.85:8797/api/v1/logs/machine-raw-live-deactive/`"”” and the format the data shoudl be sent is this : “”**

{
"machine_id": 5
}

“” and then activate the job using the same porcuedure as mentioned before.

when the user is from the custom or scheduked job and wants to work on the inprogress job then just deactive the job and updated the details for the newly seelcted scheduled job.

and then the most improtant part is the part progress and updation section to get the current section job progress for the same use the endpoint : “”

**`http://172.18.7.88:5458/api/v1/logs/quantities/163`"” and the format of the data is : “””**

```json
{
  "completed_quantity": 5,
  "remaining_quantity": 19,
  "total_quantity": 24
}
```

“””

and also there should be option to update the part progress using the endpoint : “””

**`http://172.18.7.88:5458/api/v1/logs/operator-log`"”” with the format : “”**

{
"operator_id": 0,
"operation_id": 0,
"machine_id": 0,
"start_time": "2025-05-19T11:53:03.172Z",
"end_time": "2025-05-19T11:53:03.172Z",
"quantity_completed": 0,
"quantity_rejected": 0,
"notes": "string"
}

“”” get the operator_id form the local storage and operation id from the currenlty selected operation and the uodate production endpoint.