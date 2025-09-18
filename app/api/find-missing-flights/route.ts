import { NextResponse } from 'next/server'
import { fetchSchipholFlights, transformSchipholFlight, filterFlights, removeDuplicateFlights, removeStaleFlights } from '@/lib/schiphol-api'
import { getTodayAmsterdam } from '@/lib/amsterdam-time'

export async function GET() {
  try {
    // The official 409 KLM-operated flights from Schiphol
    const officialFlights = [
      425, 427, 537, 565, 571, 587, 589, 591, 597, 601, 603, 605, 611, 621, 635, 639, 641, 643, 651, 661, 667, 671, 675, 677, 681, 685, 691, 695, 701, 705, 713, 735, 743, 749, 751, 757, 765, 791, 807, 835, 843, 855, 861, 871, 877, 879, 887, 895, 897,
      903, 907, 911, 913, 915, 917, 919, 923, 927, 931, 933, 935, 939, 941, 945, 949, 951, 953, 955, 957, 959, 961, 963, 965, 967, 971, 973, 975, 977, 979, 981, 983, 989, 991, 993, 995,
      1001, 1003, 1005, 1009, 1011, 1013, 1015, 1017, 1019, 1023, 1025, 1029, 1031, 1033, 1035, 1037, 1039, 1041, 1045, 1047, 1049, 1051, 1055, 1061, 1063, 1071, 1075, 1079, 1081, 1083, 1087, 1091, 1101, 1129, 1131, 1135, 1137, 1139, 1141, 1143, 1145, 1151, 1153, 1155, 1157, 1159, 1163, 1167, 1169, 1171, 1173, 1175, 1177, 1179, 1183, 1185, 1187, 1189, 1197, 1199,
      1201, 1203, 1205, 1207, 1215, 1217, 1219, 1223, 1225, 1227, 1229, 1231, 1233, 1235, 1239, 1245, 1247, 1251, 1253, 1255, 1267, 1269, 1271, 1273, 1275, 1279, 1283, 1285, 1287, 1289, 1291, 1293, 1295, 1297, 1299,
      1303, 1305, 1307, 1309, 1313, 1315, 1317, 1319, 1323, 1325, 1327, 1329, 1331, 1333, 1335, 1337, 1339, 1351, 1353, 1355, 1357, 1359, 1361, 1363, 1365, 1367, 1369, 1371, 1373, 1375, 1377,
      1401, 1405, 1411, 1415, 1419, 1423, 1425, 1431, 1441, 1445, 1447, 1449, 1453, 1455, 1459, 1465, 1469, 1471, 1475, 1477, 1479, 1481, 1497,
      1501, 1503, 1505, 1507, 1509, 1511, 1513, 1517, 1519, 1521, 1523, 1525, 1529, 1531, 1535, 1545, 1571, 1573, 1575, 1577, 1579, 1583, 1585, 1587, 1597,
      1601, 1603, 1605, 1607, 1609, 1613, 1615, 1619, 1629, 1633, 1637, 1639, 1641, 1645, 1647, 1651, 1653, 1655, 1657, 1659, 1661, 1663, 1665, 1667, 1681,
      1701, 1703, 1705, 1707, 1709, 1711, 1713, 1715, 1751, 1753, 1755, 1757, 1759, 1761, 1763, 1765, 1767, 1771, 1773, 1775, 1777, 1779, 1781, 1785, 1787, 1789, 1791, 1793, 1797, 1799,
      1801, 1803, 1805, 1815, 1817, 1819, 1821, 1823, 1825, 1827, 1829, 1831, 1833, 1835, 1839, 1843, 1845, 1847, 1849, 1851, 1853, 1855, 1857, 1859,
      1901, 1903, 1905, 1907, 1917, 1919, 1921, 1923, 1925, 1927, 1929, 1931, 1933, 1935, 1937, 1939, 1943, 1945, 1947, 1949, 1953, 1955, 1957, 1959, 1961, 1967, 1969, 1971, 1975, 1977, 1983, 1985, 1989
    ]
    
    console.log(`Official flight count from user: ${officialFlights.length}`)
    
    const todayDate = getTodayAmsterdam()
    
    // Fetch all flights
    const apiConfig = {
      flightDirection: 'D' as const,
      airline: 'KL',
      scheduleDate: todayDate,
      fetchAllPages: true,
      maxPagesToFetch: 50
    }
    
    const schipholData = await fetchSchipholFlights(apiConfig)
    const allFlights = (schipholData.flights || []).map(transformSchipholFlight)
    
    // Apply filtering
    let filteredFlights = filterFlights(allFlights, {
      flightDirection: 'D' as const,
      scheduleDate: todayDate,
      prefixicao: 'KL'
    })
    
    filteredFlights = removeDuplicateFlights(filteredFlights)
    filteredFlights = removeStaleFlights(filteredFlights, 72)
    
    // Get flight numbers from our data
    const ourFlightNumbers = filteredFlights.map(f => f.flightNumber).sort((a, b) => a - b)
    
    // Find missing flights
    const missingFlights = officialFlights.filter(num => !ourFlightNumbers.includes(num))
    
    // Find extra flights (in our data but not in official list)
    const extraFlights = ourFlightNumbers.filter(num => !officialFlights.includes(num))
    
    // Create detailed missing flights info by checking raw data
    const missingFlightDetails = missingFlights.map(num => {
      const flightName = `KL${num}`
      // Check if it exists in raw data
      const inRawData = allFlights.find(f => f.flightNumber === num)
      
      return {
        flightNumber: num,
        flightName,
        foundInRawData: !!inRawData,
        reason: inRawData ? 'Filtered out during processing' : 'Not returned by API',
        details: inRawData ? {
          mainFlight: inRawData.mainFlight,
          destination: inRawData.route?.destinations?.[0] || 'Unknown',
          lastUpdated: inRawData.lastUpdatedAt,
          states: inRawData.publicFlightState?.flightStates || []
        } : null
      }
    })
    
    return NextResponse.json({
      summary: {
        officialCount: officialFlights.length,
        ourCount: ourFlightNumbers.length,
        difference: officialFlights.length - ourFlightNumbers.length,
        missingCount: missingFlights.length,
        extraCount: extraFlights.length
      },
      missingFlights,
      missingFlightDetails,
      extraFlights: extraFlights.map(num => ({
        flightNumber: num,
        flightName: `KL${num}`,
        flight: filteredFlights.find(f => f.flightNumber === num)
      })),
      message: `Found ${missingFlights.length} flights missing from our data`
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}