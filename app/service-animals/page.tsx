'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, PawPrint, Info, AlertTriangle, Shield, Plane, Car, Train, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ServiceAnimalsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <Link href="/create-trip" className="inline-flex items-center text-primary hover:underline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Trip Planning
        </Link>
        
        <h1 className="text-3xl font-bold mt-4 mb-2 flex items-center">
          <PawPrint className="h-8 w-8 mr-2 text-primary" />
          Traveling with Service Animals
        </h1>
        <p className="text-gray-600 max-w-3xl">
          Service animals play a vital role in the lives of many travelers. This guide provides essential information
          about traveling with service animals, your rights, and special considerations.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2 text-primary" />
              Service Animal Rights
            </CardTitle>
            <CardDescription>Understanding your legal protections</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>
              Service animals are legally protected under various laws including the Americans with Disabilities Act (ADA) 
              in the US and similar legislation in other countries.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Service animals must be allowed in most public accommodations</li>
              <li>Businesses cannot charge extra fees for service animals</li>
              <li>Documentation is generally not required (though rules vary internationally)</li>
              <li>Service animals must be under control at all times</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Info className="h-5 w-5 mr-2 text-primary" />
              Service vs. Emotional Support Animals
            </CardTitle>
            <CardDescription>Important distinctions for travelers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>
              There are important legal distinctions between service animals and emotional support animals:
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-1">Service Animals</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Trained to perform specific tasks</li>
                  <li>Legally protected access rights</li>
                  <li>Typically dogs (sometimes miniature horses)</li>
                  <li>Protected internationally (with variations)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-1">Emotional Support Animals</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Provide comfort through presence</li>
                  <li>Limited legal protections</li>
                  <li>Can be various species</li>
                  <li>Much more restricted in travel settings</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <h2 className="text-2xl font-semibold mb-4">Transportation Considerations</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Plane className="h-5 w-5 mr-2 text-primary" />
              Air Travel
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <ul className="space-y-2">
              <li><span className="font-medium">Notification:</span> Contact the airline 48 hours in advance</li>
              <li><span className="font-medium">Documentation:</span> May be required for international flights</li>
              <li><span className="font-medium">Seating:</span> Service animals must fit in your floor space</li>
              <li><span className="font-medium">Restrictions:</span> Some countries have quarantine requirements</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Train className="h-5 w-5 mr-2 text-primary" />
              Train Travel
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <ul className="space-y-2">
              <li><span className="font-medium">Accommodations:</span> Reserved seating often available</li>
              <li><span className="font-medium">Relief Areas:</span> Limited on trains, plan for stops</li>
              <li><span className="font-medium">International:</span> Rules vary by country and train service</li>
              <li><span className="font-medium">Booking:</span> Notify service when purchasing tickets</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Car className="h-5 w-5 mr-2 text-primary" />
              Road Travel
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <ul className="space-y-2">
              <li><span className="font-medium">Safety:</span> Use proper restraints/safety harnesses</li>
              <li><span className="font-medium">Breaks:</span> Plan regular stops for relief and exercise</li>
              <li><span className="font-medium">Comfort:</span> Ensure adequate space and ventilation</li>
              <li><span className="font-medium">Border Crossing:</span> May require health certificates</li>
            </ul>
          </CardContent>
        </Card>
      </div>
      
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded mb-8">
        <div className="flex">
          <AlertTriangle className="h-6 w-6 text-amber-500 mr-3 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-amber-800">International Travel Considerations</h3>
            <p className="text-amber-700 mt-1">
              Be aware that service animal recognition and rights vary significantly between countries. 
              Always research destination-specific requirements well in advance, including vaccination 
              requirements, quarantine periods, and documentation needs.
            </p>
          </div>
        </div>
      </div>
      
      <h2 className="text-2xl font-semibold mb-4">Accommodation Tips</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="h-5 w-5 mr-2 text-primary" />
              Lodging with Service Animals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Before Booking:</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Inform the property about your service animal</li>
                <li>Request a room with easy outdoor access if possible</li>
                <li>Ask about nearby relief areas</li>
                <li>Confirm any documentation requirements</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">During Your Stay:</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Request housekeeping at specific times when convenient</li>
                <li>Protect bedding with a sheet or blanket you bring</li>
                <li>Carry cleanup supplies at all times</li>
                <li>Carry a copy of relevant service animal laws</li>
              </ul>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Essential Packing List</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-2">
              <li className="flex items-center">
                <PawPrint className="h-4 w-4 mr-2 text-primary" />
                Service animal documentation
              </li>
              <li className="flex items-center">
                <PawPrint className="h-4 w-4 mr-2 text-primary" />
                Health certificates & vaccination records
              </li>
              <li className="flex items-center">
                <PawPrint className="h-4 w-4 mr-2 text-primary" />
                Familiar food & treats
              </li>
              <li className="flex items-center">
                <PawPrint className="h-4 w-4 mr-2 text-primary" />
                Portable water bowl
              </li>
              <li className="flex items-center">
                <PawPrint className="h-4 w-4 mr-2 text-primary" />
                Waste disposal bags
              </li>
              <li className="flex items-center">
                <PawPrint className="h-4 w-4 mr-2 text-primary" />
                Portable bed/mat
              </li>
              <li className="flex items-center">
                <PawPrint className="h-4 w-4 mr-2 text-primary" />
                Grooming supplies
              </li>
              <li className="flex items-center">
                <PawPrint className="h-4 w-4 mr-2 text-primary" />
                First aid kit for animals
              </li>
              <li className="flex items-center">
                <PawPrint className="h-4 w-4 mr-2 text-primary" />
                Vest/harness with ID
              </li>
              <li className="flex items-center">
                <PawPrint className="h-4 w-4 mr-2 text-primary" />
                Contact info of vets at destination
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
      
      <div className="text-center mt-12">
        <p className="text-gray-600 mb-4">Need more specific information for your trip?</p>
        <Button asChild>
          <Link href="/create-trip">Return to Trip Planning</Link>
        </Button>
      </div>
    </div>
  );
} 