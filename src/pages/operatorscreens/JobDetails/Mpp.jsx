import React from 'react';
import belImage from '../../../assets/bel.png';

const MPP = () => {
  const processData = [
    { opNo: '10', description: 'Verification of documents as per OARC', shtInd: 'N', workCenter: 'FABC-PC', machine: '' },
    { opNo: '20', description: 'Cutting', shtInd: 'Y', workCenter: 'MMC1', machine: 'Any' },
    { opNo: '30', description: 'Milling', shtInd: 'Y', workCenter: 'CNCM', machine: 'Any' },
    { opNo: '40', description: 'Milling - Top Rough', shtInd: 'Y', workCenter: 'CNCM', machine: 'Any' },
    { opNo: '50', description: 'Milling - Bottom Rough', shtInd: 'Y', workCenter: 'CNCM', machine: 'Any' },
    { opNo: '60', description: 'Seasoning for around 24 Hours', shtInd: 'N', workCenter: '', machine: '' },
    { opNo: '70', description: 'Milling - Clean M/C', shtInd: 'Y', workCenter: 'CNCM', machine: 'Any' },
    { opNo: '80', description: 'Milling - Top Finish', shtInd: 'Y', workCenter: 'CNCM', machine: 'Any' },
    { opNo: '90', description: 'Milling - Bottom Finish', shtInd: 'Y', workCenter: 'CNCM', machine: 'Any' },
    { opNo: '100', description: 'Deburr', shtInd: 'Y', workCenter: 'SMPD', machine: '' },
    { opNo: '110', description: 'Inspection before plating', shtInd: 'N', workCenter: 'QFAB', machine: '' },
    { opNo: '120', description: 'Plating', shtInd: 'N', workCenter: 'MWTEST1', machine: '' },
    { opNo: '130', description: 'Plating inspection', shtInd: 'N', workCenter: 'MWTEST1', machine: '' },
    { opNo: '140', description: 'Final Inspection', shtInd: 'N', workCenter: 'QFAB', machine: '' }
  ];

  const notes = [
    'More Setup information for operation can be found in the corresponding sheets with titles OP-xx where xx is the operation number. "Y" in Sht. Ind. Column indicates its availability. NA - stands for Not Applicable.',
    '"Any" in the machine field indicates that the operation can be carried out on any of the machine under the work centre. If in doubt regarding the machine, refer to the document on machine List.',
    'Freq. - Measurement frequency for "In process inspection" mentioned in OP sheets. For 01 to 9999 etc. measurement to be done at intervals as specified by numbers. 0 for one First off inspection per batch.',
    'Irrespective of number intervals/frequency, measurements have to be carried out after initial job setting & at start of every shift. JNT refers to Job Number Tag for individual job identification'
  ];

  return (
    <div className="w-full max-w-[1600px] mx-auto p-8 space-y-8 bg-white shadow-lg">
      {/* Header Section */}
      <div className="border-b pb-6 mb-8">
        <div className="flex items-center justify-between gap-6">
        <div className="w-64"> {/* Adjust the width as needed */}
  <img src={belImage} alt="BEL Logo" className="w-full object-contain" />
</div>

          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold mb-3">FABRICATION COMPONENTS</h1>
            <h2 className="text-2xl">Manufacturing Process Plan</h2>
          </div>
        </div>
      </div>

      {/* Document Info Grid */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="border rounded-lg p-6 bg-gray-50">
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="py-2 font-semibold w-1/3">Process Plan No:</td>
                <td className="py-2">MPP-62805080AA</td>
              </tr>
              <tr>
                <td className="py-2 font-semibold">Part Number:</td>
                <td className="py-2">62805080AA</td>
              </tr>
              <tr>
                <td className="py-2 font-semibold">Description:</td>
                <td className="py-2">Closing Cover</td>
              </tr>
              <tr>
                <td className="py-2 font-semibold">Dept | Project:</td>
                <td className="py-2">MWSC | Thales</td>
              </tr>
              <tr>
                <td className="py-2 font-semibold">Raw Material:</td>
                <td className="py-2">ALUMINIUM 65032 FLAT-14 mm (Al-6061 T651)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="border rounded-lg p-6 bg-gray-50">
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="py-2 font-semibold w-1/3">Rev:</td>
                <td className="py-2">01</td>
              </tr>
              <tr>
                <td className="py-2 font-semibold">Rev:</td>
                <td className="py-2">B</td>
              </tr>
              <tr>
                <td className="py-2 font-semibold">Prepared by:</td>
                <td className="py-2">Anupam Jha</td>
              </tr>
              <tr>
                <td className="py-2 font-semibold">Reviewed by:</td>
                <td className="py-2">Apoorv Nema</td>
              </tr>
              <tr>
                <td className="py-2 font-semibold">Approved by:</td>
                <td className="py-2">Prasad V M</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Process Table */}
      <div className="border rounded-lg overflow-hidden mb-8">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-6 py-4 text-left font-semibold text-gray-700 w-24">Op No</th>
              <th className="border px-6 py-4 text-left font-semibold text-gray-700">Operation Description</th>
              <th className="border px-6 py-4 text-left font-semibold text-gray-700 w-32">Sht. Ind.</th>
              <th className="border px-6 py-4 text-left font-semibold text-gray-700 w-40">Work Center</th>
              <th className="border px-6 py-4 text-left font-semibold text-gray-700 w-40">Machine</th>
            </tr>
          </thead>
          <tbody>
            {processData.map((row, index) => (
              <tr key={row.opNo} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border px-6 py-3">{row.opNo}</td>
                <td className="border px-6 py-3">{row.description}</td>
                <td className="border px-6 py-3 text-center">{row.shtInd}</td>
                <td className="border px-6 py-3">{row.workCenter}</td>
                <td className="border px-6 py-3">{row.machine}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Notes Section */}
      <div className="border rounded-lg p-6 bg-gray-50">
        <h3 className="font-semibold text-lg mb-4">Notes:</h3>
        <ol className="list-decimal list-inside space-y-4 text-sm">
          {notes.map((note, index) => (
            <li key={index} className="leading-relaxed pl-3">
              {note}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default MPP;


